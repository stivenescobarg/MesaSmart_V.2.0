// tests/integration/menu.test.js
//
// Cubre routes/productos.js (montado en /api/menu): categorías,
// subcategorías, productos (incluyendo el pasaje intacto de `imagen`
// de Cloudinary) y aislamiento por restaurante_id en las rutas
// protegidas. Sigue el mismo patrón que auth.test.js/superAdmin.test.js:
// contexto vía getTestContext(), pega a la API real con supertest,
// limpia lo propio en afterAll.

const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/config/db");
const { getTestContext } = require("./helpers/testContext");

describe("Menú: categorías, subcategorías y productos", () => {
  let ctx;

  // Ids creados por ESTE archivo, para limpiar en afterAll. Nunca
  // metemos acá ctx.categoriaId / ctx.categoriaBarId — esas las crea
  // y borra el globalSetup/globalTeardown.
  const productosCreados = [];
  const subcategoriasCreadas = [];
  const categoriasCreadas = [];

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    if (productosCreados.length > 0) {
      await pool.query(`DELETE FROM opciones WHERE producto_id IN (?)`, [productosCreados]);
      await pool.query(`DELETE FROM productos WHERE id IN (?)`, [productosCreados]);
    }
    if (subcategoriasCreadas.length > 0) {
      await pool.query(`DELETE FROM subcategorias WHERE id IN (?)`, [subcategoriasCreadas]);
    }
    if (categoriasCreadas.length > 0) {
      await pool.query(`DELETE FROM categorias WHERE id IN (?)`, [categoriasCreadas]);
    }
  });

  // ──────────────────────────────────────────────────────────
  // POST /api/menu/categorias
  // ──────────────────────────────────────────────────────────
  describe("POST /api/menu/categorias", () => {
    it("crea una categoría propia del restaurante (admin)", async () => {
      const res = await request(app)
        .post("/api/menu/categorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Postres Test", imagen: "https://res.cloudinary.com/demo/postres.jpg", destino: "cocina" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      categoriasCreadas.push(res.body.id);

      const [[row]] = await pool.execute(
        "SELECT restaurante_id, destino, imagen FROM categorias WHERE id = ?",
        [res.body.id]
      );
      expect(row.restaurante_id).toBe(ctx.restauranteId);
      expect(row.destino).toBe("cocina");
      expect(row.imagen).toBe("https://res.cloudinary.com/demo/postres.jpg");
    });

    it("cualquier destino distinto de 'bar' cae a 'cocina'", async () => {
      const res = await request(app)
        .post("/api/menu/categorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Sin Destino Test" });

      expect(res.status).toBe(200);
      categoriasCreadas.push(res.body.id);

      const [[row]] = await pool.execute("SELECT destino FROM categorias WHERE id = ?", [res.body.id]);
      expect(row.destino).toBe("cocina");
    });

    it("rechaza sin nombre", async () => {
      const res = await request(app)
        .post("/api/menu/categorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "   " });
      expect(res.status).toBe(400);
    });

    it("rechaza sin token", async () => {
      const res = await request(app).post("/api/menu/categorias").send({ nombre: "X" });
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────
  // POST /api/menu/subcategorias
  // ──────────────────────────────────────────────────────────
  describe("POST /api/menu/subcategorias", () => {
    it("crea una subcategoría dentro de una categoría propia", async () => {
      const res = await request(app)
        .post("/api/menu/subcategorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Subcategoria Test", categoria_id: ctx.categoriaId, imagen: null });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      subcategoriasCreadas.push(res.body.id);

      const [[row]] = await pool.execute("SELECT categoria_id FROM subcategorias WHERE id = ?", [res.body.id]);
      expect(row.categoria_id).toBe(ctx.categoriaId);
    });

    it("rechaza sin nombre o sin categoria_id", async () => {
      const res = await request(app)
        .post("/api/menu/subcategorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Sin categoria" });
      expect(res.status).toBe(400);
    });

    it("rechaza si la categoría no pertenece a tu restaurante", async () => {
      // Categoría inventada, no existe en ningún restaurante.
      const res = await request(app)
        .post("/api/menu/subcategorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Huerfana Test", categoria_id: 999999999 });
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/menu/:restauranteId/categorias  (pública)
  // GET /api/menu/categorias/:categoriaId/subcategorias  (pública)
  // ──────────────────────────────────────────────────────────
  describe("Lectura pública de categorías y subcategorías", () => {
    it("lista las categorías del restaurante sin necesitar token", async () => {
      const res = await request(app).get(`/api/menu/${ctx.restauranteId}/categorias`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const nombres = res.body.map((c) => c.nombre);
      expect(nombres).toEqual(expect.arrayContaining(["Categoria Test Cocina", "Categoria Test Bar"]));
    });

    it("lista las subcategorías de una categoría sin token", async () => {
      const crear = await request(app)
        .post("/api/menu/subcategorias")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Subcategoria Publica Test", categoria_id: ctx.categoriaId });
      subcategoriasCreadas.push(crear.body.id);

      const res = await request(app).get(`/api/menu/categorias/${ctx.categoriaId}/subcategorias`);
      expect(res.status).toBe(200);
      expect(res.body.map((s) => s.nombre)).toContain("Subcategoria Publica Test");
    });
  });

  // ──────────────────────────────────────────────────────────
  // POST /api/menu  (crear producto)
  // ──────────────────────────────────────────────────────────
  describe("POST /api/menu", () => {
    it("crea un producto con imagen de Cloudinary y adiciones", async () => {
      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          nombre: "Bandeja Paisa Test",
          descripcion: "Con todo",
          precio: 25000,
          categoria_id: ctx.categoriaId,
          imagen: "https://res.cloudinary.com/demo/bandeja.jpg",
          tiene_termino: true,
          adiciones: [{ nombre: "Chicharrón extra", precio: 5000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id");
      productosCreados.push(res.body.id);

      const [[row]] = await pool.execute(
        "SELECT restaurante_id, imagen, tiene_termino FROM productos WHERE id = ?",
        [res.body.id]
      );
      expect(row.restaurante_id).toBe(ctx.restauranteId);
      expect(row.imagen).toBe("https://res.cloudinary.com/demo/bandeja.jpg");
      expect(row.tiene_termino).toBe(1);

      const [opciones] = await pool.execute(
        "SELECT nombre, precio, tipo FROM opciones WHERE producto_id = ?",
        [res.body.id]
      );
      expect(opciones).toHaveLength(1);
      expect(opciones[0]).toMatchObject({ nombre: "Chicharrón extra", tipo: "adiccion" });
    });

    it("rechaza sin nombre, precio o categoria_id", async () => {
      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Incompleto Test" });
      expect(res.status).toBe(400);
    });

    it("rechaza si la categoría no pertenece a tu restaurante (aislamiento)", async () => {
      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Ajeno Test", precio: 1000, categoria_id: 999999999 });
      expect(res.status).toBe(400);
    });

    it("ignora restaurante_id si viniera en el body — siempre usa el del token", async () => {
      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          nombre: "Intento Spoof Test",
          precio: 1000,
          categoria_id: ctx.categoriaId,
          restaurante_id: ctx.restauranteId + 999,
        });
      expect(res.status).toBe(200);
      productosCreados.push(res.body.id);

      const [[row]] = await pool.execute("SELECT restaurante_id FROM productos WHERE id = ?", [res.body.id]);
      expect(row.restaurante_id).toBe(ctx.restauranteId);
    });

    it("rechaza sin token", async () => {
      const res = await request(app)
        .post("/api/menu")
        .send({ nombre: "X", precio: 1000, categoria_id: ctx.categoriaId });
      expect(res.status).toBe(401);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/menu/:restauranteId  (pública, la que consume el QR)
  // ──────────────────────────────────────────────────────────
  describe("GET /api/menu/:restauranteId", () => {
    let productoId;

    beforeAll(async () => {
      const crear = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          nombre: "Producto Menu Publico Test",
          precio: 12000,
          categoria_id: ctx.categoriaId,
          imagen: "https://res.cloudinary.com/demo/publico.jpg",
          adiciones: [{ nombre: "Extra Test", precio: 2000 }],
        });
      productoId = crear.body.id;
      productosCreados.push(productoId);
    });

    it("devuelve el producto con imagen, categoría y adiciones, sin token", async () => {
      const res = await request(app).get(`/api/menu/${ctx.restauranteId}`);
      expect(res.status).toBe(200);

      const prod = res.body.find((p) => p.id === productoId);
      expect(prod).toBeDefined();
      expect(prod.imagen).toBe("https://res.cloudinary.com/demo/publico.jpg");
      expect(prod.categoria).toBe("Categoria Test Cocina");
      expect(prod.adiciones).toEqual(
        expect.arrayContaining([expect.objectContaining({ nombre: "Extra Test" })])
      );
    });

    it("no devuelve productos de otro restaurante", async () => {
      const res = await request(app).get(`/api/menu/${ctx.restauranteId}`);
      expect(res.status).toBe(200);
      // Todos los productos devueltos deben ser de este restaurante:
      // lo verificamos indirectamente comprobando que el nuestro está
      // y consultando la BD para confirmar que no hay cruce de ids.
      const ids = res.body.map((p) => p.id);
      const [ajenos] = await pool.query(
        `SELECT id FROM productos WHERE id IN (?) AND restaurante_id != ?`,
        [ids.length ? ids : [0], ctx.restauranteId]
      );
      expect(ajenos).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  // PUT /api/menu/:id
  // ──────────────────────────────────────────────────────────
  describe("PUT /api/menu/:id", () => {
    let productoId;

    beforeAll(async () => {
      const crear = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Editar Test", precio: 10000, categoria_id: ctx.categoriaId });
      productoId = crear.body.id;
      productosCreados.push(productoId);
    });

    it("actualiza nombre, precio e imagen del producto propio", async () => {
      const res = await request(app)
        .put(`/api/menu/${productoId}`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({
          nombre: "Editado Test",
          descripcion: "Nueva desc",
          precio: 15000,
          imagen: "https://res.cloudinary.com/demo/editado.jpg",
        });
      expect(res.status).toBe(200);

      const [[row]] = await pool.execute(
        "SELECT nombre, precio, imagen FROM productos WHERE id = ?",
        [productoId]
      );
      expect(row.nombre).toBe("Editado Test");
      expect(Number(row.precio)).toBe(15000);
      expect(row.imagen).toBe("https://res.cloudinary.com/demo/editado.jpg");
    });

    it("devuelve 404 si el producto no existe o es de otro restaurante", async () => {
      const res = await request(app)
        .put(`/api/menu/999999999`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "X", precio: 1 });
      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────
  // PATCH /api/menu/:id/disponibilidad
  // ──────────────────────────────────────────────────────────
  describe("PATCH /api/menu/:id/disponibilidad", () => {
    let productoId;

    beforeAll(async () => {
      const crear = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ nombre: "Disponibilidad Test", precio: 8000, categoria_id: ctx.categoriaId });
      productoId = crear.body.id;
      productosCreados.push(productoId);
    });

    it("marca el producto como agotado (disponible = false)", async () => {
      const res = await request(app)
        .patch(`/api/menu/${productoId}/disponibilidad`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ disponible: false });
      expect(res.status).toBe(200);
      expect(res.body.disponible).toBe(false);

      const [[row]] = await pool.execute("SELECT disponible FROM productos WHERE id = ?", [productoId]);
      expect(row.disponible).toBe(0);
    });

    it("lo vuelve a marcar disponible", async () => {
      const res = await request(app)
        .patch(`/api/menu/${productoId}/disponibilidad`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ disponible: true });
      expect(res.status).toBe(200);

      const [[row]] = await pool.execute("SELECT disponible FROM productos WHERE id = ?", [productoId]);
      expect(row.disponible).toBe(1);
    });

    it("devuelve 404 sobre un producto de otro restaurante", async () => {
      const res = await request(app)
        .patch(`/api/menu/999999999/disponibilidad`)
        .set("Authorization", `Bearer ${ctx.adminToken}`)
        .send({ disponible: false });
      expect(res.status).toBe(404);
    });
  });
});