// tests/integration/bar.test.js
//
// Cubre routes/admin/barRoutes.js (montado en /api/bar):
//   - POST /:slug/ordenes (pública, publicTenant): match de stock por
//     NOMBRE (case-insensitive), todo-o-nada si un item falla.
//   - GET /ordenes/mesa/:mesaId (pública)
//   - GET /ordenes, /historial, /resumen, /inventario, /actividad
//     (protegidas, admin|bartender)
//   - PATCH /ordenes/:id/estado (transiciones válidas)
//   - PATCH /ordenes/:id/pagar-parcial
//   - POST /inventario/consumos (requiere PIN, con rate limiting)
//
// Sigue el patrón de auth.test.js/superAdmin.test.js: getTestContext(),
// supertest contra la API real, limpieza propia en afterAll.

const crypto = require("crypto");
const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/db");
const { getTestContext } = require("./helpers/testContext");
const BarAuditLog = require("../../src/models/BarAuditLog");

const hashPin = (pin) => crypto.createHash("sha256").update(pin).digest("hex");

describe("Bar: crear/operar órdenes, inventario y consumo con PIN", () => {
  let ctx;

  beforeAll(async () => {
    ctx = getTestContext();

    // Inventario de bar fijo para toda la suite. Nombres prefijados
    // "Bar Test ..." para no chocar con stock que creen otros specs.
    const productos = [
      { nombre: "Bar Test Cerveza", cantidad_actual: 20, cantidad_minima: 5 },
      { nombre: "Bar Test Gaseosa", cantidad_actual: 10, cantidad_minima: 5 },
      { nombre: "Bar Test Bajo Stock", cantidad_actual: 2, cantidad_minima: 5 },
      { nombre: "Bar Test Consumo", cantidad_actual: 15, cantidad_minima: 5 },
    ];
    for (const p of productos) {
      await pool.execute(
        `INSERT INTO stock_productos
           (restaurante_id, nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima, activo)
         VALUES (?, ?, ?, 'bar', 'unidad', ?, ?, TRUE)`,
        [ctx.restauranteId, p.nombre, "Proveedor Test", p.cantidad_actual, p.cantidad_minima]
      );
    }
  });

  afterAll(async () => {
    // globalTeardown ya borra ordenes_bar y stock_productos por
    // restaurante_id, pero bar_audit_logs NO está en esa lista —lo
    // limpiamos acá para no acumular basura en Aiven entre corridas.
    // (Vale la pena sumarlo a globalTeardown.js también.)
    await pool.execute("DELETE FROM bar_audit_logs WHERE restaurante_id = ?", [ctx.restauranteId]);
    // Dejamos el PIN de seguridad como estaba (sin configurar), para no
    // afectar otras suites que dependan del fallback de STOCK_PIN.
    await pool.execute("UPDATE restaurantes SET pin_seguridad = NULL WHERE id = ?", [ctx.restauranteId]);
  });

  const crearOrden = (body) => request(app).post(`/api/bar/${ctx.slug}/ordenes`).send(body);

  // ──────────────────────────────────────────────────────────
  // POST /api/bar/:slug/ordenes  (pública)
  // ──────────────────────────────────────────────────────────
  describe("Crear orden de bar", () => {
    it("crea la orden, descuenta stock y registra auditoría (caso feliz)", async () => {
      const res = await crearOrden({
        mesa: "77",
        items: [{ nombre: "Bar Test Cerveza", cantidad: 2, precio: 8000 }],
      });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty("id");

      const [[stock]] = await pool.execute(
        "SELECT cantidad_actual FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Cerveza", ctx.restauranteId]
      );
      expect(Number(stock.cantidad_actual)).toBe(18); // 20 - 2

      const logs = await BarAuditLog.obtenerPorOrden(ctx.restauranteId, res.body.id);
      expect(logs.some((l) => l.accion === "orden_creada")).toBe(true);
    });

    it("matchea el nombre del producto sin importar mayúsculas/minúsculas", async () => {
      const res = await crearOrden({
        mesa: "78",
        items: [{ nombre: "bar test GASEOSA", cantidad: 1, precio: 5000 }],
      });
      expect(res.status).toBe(201);

      const [[stock]] = await pool.execute(
        "SELECT cantidad_actual FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Gaseosa", ctx.restauranteId]
      );
      expect(Number(stock.cantidad_actual)).toBe(9); // 10 - 1
    });

    it("rechaza si el nombre del item no coincide con nada del inventario, sin crear la orden", async () => {
      const res = await crearOrden({
        mesa: "79",
        items: [{ nombre: "Producto Que No Existe En Bar", cantidad: 1, precio: 1000 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/no encontrado en inventario/i);

      const [ordenes] = await pool.execute(
        "SELECT id FROM ordenes_bar WHERE restaurante_id = ? AND mesa = ?",
        [ctx.restauranteId, "79"]
      );
      expect(ordenes).toHaveLength(0);
    });

    it("rechaza si el stock es insuficiente, sin descontar ni crear la orden", async () => {
      const res = await crearOrden({
        mesa: "80",
        items: [{ nombre: "Bar Test Cerveza", cantidad: 999, precio: 8000 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.msg).toMatch(/stock insuficiente/i);

      const [[stock]] = await pool.execute(
        "SELECT cantidad_actual FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Cerveza", ctx.restauranteId]
      );
      expect(Number(stock.cantidad_actual)).toBe(18); // sin cambios respecto al test anterior

      const [ordenes] = await pool.execute(
        "SELECT id FROM ordenes_bar WHERE restaurante_id = ? AND mesa = ?",
        [ctx.restauranteId, "80"]
      );
      expect(ordenes).toHaveLength(0);
    });

    it("si un item de varios falla, no descuenta stock de ninguno (todo o nada)", async () => {
      const [[antes]] = await pool.execute(
        "SELECT cantidad_actual FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Cerveza", ctx.restauranteId]
      );

      const res = await crearOrden({
        mesa: "81",
        items: [
          { nombre: "Bar Test Cerveza", cantidad: 1, precio: 8000 },
          { nombre: "No Existe", cantidad: 1, precio: 1000 },
        ],
      });
      expect(res.status).toBe(400);

      const [[despues]] = await pool.execute(
        "SELECT cantidad_actual FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Cerveza", ctx.restauranteId]
      );
      expect(Number(despues.cantidad_actual)).toBe(Number(antes.cantidad_actual));
    });

    it("rechaza sin mesa", async () => {
      const res = await crearOrden({ items: [{ nombre: "Bar Test Cerveza", cantidad: 1 }] });
      expect(res.status).toBe(400);
    });

    it("rechaza sin items o con items vacíos", async () => {
      const res = await crearOrden({ mesa: "82", items: [] });
      expect(res.status).toBe(400);
    });

    it("no permite crear órdenes en un slug que no corresponde a ningún restaurante activo", async () => {
      const res = await request(app)
        .post("/api/bar/slug-inexistente-test/ordenes")
        .send({ mesa: "1", items: [{ nombre: "X", cantidad: 1 }] });
      expect([400, 404]).toContain(res.status);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/bar/ordenes/mesa/:mesaId  (pública)
  // ──────────────────────────────────────────────────────────
  describe("GET /api/bar/ordenes/mesa/:mesaId", () => {
    it("devuelve los items de bar activos de esa mesa, sin token", async () => {
      await crearOrden({
        mesa: "90",
        items: [{ nombre: "Bar Test Consumo", cantidad: 1, precio: 6000 }],
      });

      const res = await request(app).get("/api/bar/ordenes/mesa/90").query({ restaurante_id: ctx.restauranteId });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ nombre: "Bar Test Consumo", categoria: "bar" })])
      );
    });

    it("rechaza sin restaurante_id", async () => {
      const res = await request(app).get("/api/bar/ordenes/mesa/90");
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/bar/ordenes, /historial, /resumen, /inventario, /actividad
  // (protegidas: auth + tenant + role admin|bartender)
  // ──────────────────────────────────────────────────────────
  describe("Lectura protegida (admin)", () => {
    it("lista las órdenes activas", async () => {
      const res = await request(app).get("/api/bar/ordenes").set("Authorization", `Bearer ${ctx.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.ordenes)).toBe(true);
    });

    it("el inventario incluye los productos de bar creados", async () => {
      const res = await request(app).get("/api/bar/inventario").set("Authorization", `Bearer ${ctx.adminToken}`);
      expect(res.status).toBe(200);
      const nombres = res.body.productos.map((p) => p.nombre);
      expect(nombres).toEqual(expect.arrayContaining(["Bar Test Cerveza", "Bar Test Bajo Stock"]));
    });

    it("el resumen marca como alerta el producto de bajo stock", async () => {
      const res = await request(app).get("/api/bar/resumen").set("Authorization", `Bearer ${ctx.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.alertas_stock.some((p) => p.nombre === "Bar Test Bajo Stock")).toBe(true);
    });

    it("historial y actividad responden 200", async () => {
      const [historial, actividad] = await Promise.all([
        request(app).get("/api/bar/historial").set("Authorization", `Bearer ${ctx.adminToken}`),
        request(app).get("/api/bar/actividad").set("Authorization", `Bearer ${ctx.adminToken}`),
      ]);
      expect(historial.status).toBe(200);
      expect(actividad.status).toBe(200);
      expect(Array.isArray(actividad.body.actividad)).toBe(true);
    });

    it("rechaza todas estas rutas sin token", async () => {
      const rutas = ["/api/bar/ordenes", "/api/bar/historial", "/api/bar/resumen", "/api/bar/inventario", "/api/bar/actividad"];
      for (const ruta of rutas) {
        const res = await request(app).get(ruta);
        expect(res.status).toBe(401);
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  // PATCH /api/bar/ordenes/:id/estado
  // ──────────────────────────────────────────────────────────
  describe("PATCH /api/bar/ordenes/:id/estado", () => {
    let ordenId;

    beforeEach(async () => {
      const crear = await crearOrden({
        mesa: "estado-test",
        items: [{ nombre: "Bar Test Consumo", cantidad: 1, precio: 1000 }],
      });
      ordenId = crear.body.id;
    });

    it("avanza pendiente → en_preparacion → listo → pagado", async () => {
      const paso1 = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/estado`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ estado: "en_preparacion" });
      expect(paso1.status).toBe(200);
      expect(paso1.body.orden.estado).toBe("en_preparacion");

      const paso2 = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/estado`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ estado: "listo" });
      expect(paso2.status).toBe(200);

      const paso3 = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/estado`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ estado: "pagado" });
      expect(paso3.status).toBe(200);
      expect(paso3.body.orden.estado).toBe("pagado");
    });

    it("rechaza una transición no permitida (pendiente → listo)", async () => {
      const res = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/estado`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ estado: "listo" });
      expect(res.status).toBe(409);
    });

    it("404 sobre una orden inexistente", async () => {
      const res = await request(app)
        .patch(`/api/bar/ordenes/999999999/estado`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ estado: "en_preparacion" });
      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────
  // PATCH /api/bar/ordenes/:id/pagar-parcial
  // ──────────────────────────────────────────────────────────
  describe("PATCH /api/bar/ordenes/:id/pagar-parcial", () => {
    let ordenId;

    beforeEach(async () => {
      const crear = await crearOrden({
        mesa: "pago-test",
        items: [
          { nombre: "Bar Test Cerveza", cantidad: 2, precio: 8000 },
          { nombre: "Bar Test Gaseosa", cantidad: 2, precio: 5000 },
        ],
      });
      ordenId = crear.body.id;
    });

    it("paga parcialmente un item y deja la orden activa con el resto", async () => {
      const res = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/pagar-parcial`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ pagos: [{ index: 0, cantidad: 1 }] });

      expect(res.status).toBe(200);
      expect(res.body.orden.estado).not.toBe("pagado");
      expect(res.body.orden.items_restantes).toBe(2);

      const [[row]] = await pool.execute("SELECT items FROM ordenes_bar WHERE id = ?", [ordenId]);
      const items = JSON.parse(row.items);
      expect(items.find((i) => i.nombre === "Bar Test Cerveza").cantidad).toBe(1);
    });

    it("paga todo y la orden pasa a 'pagado'", async () => {
      const res = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/pagar-parcial`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          pagos: [
            { index: 0, cantidad: 2 },
            { index: 1, cantidad: 2 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.orden.estado).toBe("pagado");
      expect(res.body.orden.items_restantes).toBe(0);
    });

    it("rechaza pagar de nuevo una orden ya pagada", async () => {
      await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/pagar-parcial`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          pagos: [
            { index: 0, cantidad: 2 },
            { index: 1, cantidad: 2 },
          ],
        });

      const res = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/pagar-parcial`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ pagos: [{ index: 0, cantidad: 1 }] });
      expect(res.status).toBe(409);
    });

    it("rechaza sin pagos", async () => {
      const res = await request(app)
        .patch(`/api/bar/ordenes/${ordenId}/pagar-parcial`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ pagos: [] });
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────
  // POST /api/bar/inventario/consumos  (requiere PIN)
  // Orden de los tests importa: el de rate-limit va AL FINAL, porque
  // deja al restaurante bloqueado por 15 min y rompería los casos
  // posteriores que necesitan el PIN correcto.
  // ──────────────────────────────────────────────────────────
  describe("POST /api/bar/inventario/consumos", () => {
    const PIN = "9999";
    let productoId;

    beforeAll(async () => {
      await pool.execute("UPDATE restaurantes SET pin_seguridad = ? WHERE id = ?", [hashPin(PIN), ctx.restauranteId]);
      const [[row]] = await pool.execute(
        "SELECT id FROM stock_productos WHERE nombre = ? AND restaurante_id = ?",
        ["Bar Test Consumo", ctx.restauranteId]
      );
      productoId = row.id;
    });

    it("rechaza sin PIN", async () => {
      const res = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: productoId, cantidad: 1 });
      expect(res.status).toBe(403);
      expect(res.body.codigo).toBe("PIN_REQUERIDO");
    });

    it("rechaza PIN con formato inválido", async () => {
      const res = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: productoId, cantidad: 1, pin: "abc" });
      expect(res.status).toBe(403);
      expect(res.body.codigo).toBe("PIN_FORMATO_INVALIDO");
    });

    it("registra el consumo y reduce el inventario con el PIN correcto", async () => {
      const [[antes]] = await pool.execute("SELECT cantidad_actual FROM stock_productos WHERE id = ?", [productoId]);

      const res = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: productoId, cantidad: 3, pin: PIN });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(Number(res.body.cantidad_actual)).toBe(Number(antes.cantidad_actual) - 3);

      const logs = await BarAuditLog.obtenerPorProducto(ctx.restauranteId, productoId);
      expect(logs.some((l) => l.accion === "consumo_manual")).toBe(true);
    });

    it("rechaza cantidad <= 0", async () => {
      const res = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: productoId, cantidad: 0, pin: PIN });
      expect(res.status).toBe(400);
    });

    it("404 si el producto no existe en el bar de este restaurante", async () => {
      const res = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: 999999999, cantidad: 1, pin: PIN });
      expect(res.status).toBe(404);
    });

    it("bloquea después de 3 intentos con PIN incorrecto (rate limit)", async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post("/api/bar/inventario/consumos")
          .set("Authorization", `Bearer ${ctx.adminToken}`)
          .send({ producto_id: productoId, cantidad: 1, pin: "0000" });
        expect(res.status).toBe(403);
        expect(res.body.codigo).toBe("PIN_INCORRECTO");
      }

      const bloqueado = await request(app)
        .post("/api/bar/inventario/consumos")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ producto_id: productoId, cantidad: 1, pin: "0000" });
      expect(bloqueado.status).toBe(403);
      expect(bloqueado.body.codigo).toBe("PIN_BLOQUEADO");
    });
  });
});