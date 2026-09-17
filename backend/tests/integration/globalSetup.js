// tests/integration/globalSetup.js
//
// Corre UNA sola vez antes de toda la suite de integración. Deja todo
// el contexto necesario (ids, tokens) en tests/integration/.test-context.json,
// que los specs leen con helpers/testContext.js.
//
// Requiere TEST_SUPERADMIN_EMAIL / TEST_SUPERADMIN_PASSWORD en .env.test
// (ver .env.test.example).

require("dotenv").config({ path: ".env.test" });
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { crearPoolDirecto } = require("./helpers/dbDirect");

const CONTEXT_FILE = path.join(__dirname, ".test-context.json");
const TEST_SLUG = "test-mesasmart";

async function limpiarRestauranteExistente(pool, restauranteId) {
  // Orden por FKs: hijos primero, restaurantes al final.
  await pool.execute(
    `DELETE dp FROM detalle_pedido dp JOIN pedidos p ON p.id = dp.pedido_id WHERE p.restaurante_id = ?`,
    [restauranteId]
  );
  await pool.execute(`DELETE FROM pedidos WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(`DELETE FROM ordenes_bar WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(`DELETE FROM stock_movimientos WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(`DELETE FROM stock_productos WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(
    `DELETE o FROM opciones o JOIN productos p ON p.id = o.producto_id WHERE p.restaurante_id = ?`,
    [restauranteId]
  );
  await pool.execute(`DELETE FROM productos WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(
    `DELETE FROM subcategorias WHERE categoria_id IN (SELECT id FROM categorias WHERE restaurante_id = ?)`,
    [restauranteId]
  );
  await pool.execute(`DELETE FROM categorias WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(
    `DELETE s FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE u.restaurante_id = ?`,
    [restauranteId]
  );
  await pool.execute(`DELETE FROM usuarios WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(`DELETE FROM mesas WHERE restaurante_id = ?`, [restauranteId]);
  await pool.execute(`DELETE FROM restaurantes WHERE id = ?`, [restauranteId]);
}

module.exports = async () => {
  if (!process.env.TEST_SUPERADMIN_EMAIL || !process.env.TEST_SUPERADMIN_PASSWORD) {
    throw new Error(
      "Faltan TEST_SUPERADMIN_EMAIL / TEST_SUPERADMIN_PASSWORD. Definilas en .env.test (ver .env.test.example)."
    );
  }

  // require tardío: recién acá tiene sentido cargar la app, después de
  // que dotenv ya puso las env vars en process.env. La app usa SU
  // PROPIO pool internamente (src/config/db.js) para atender las
  // requests reales — no lo tocamos directamente en ningún momento.
  const app = require("../../src/app");

  // Este pool es nuestro, exclusivo de este archivo, para las queries
  // directas de abajo. Se cierra al final, en el finally.
  const pool = crearPoolDirecto();

  try {
    // 1. Si quedó un restaurante de prueba de una corrida anterior que
    //    falló a mitad de camino, lo limpiamos antes de arrancar.
    const [existentes] = await pool.execute("SELECT id FROM restaurantes WHERE slug = ?", [TEST_SLUG]);
    if (existentes.length > 0) {
      await limpiarRestauranteExistente(pool, existentes[0].id);
    }

    // 2. Login como super_admin real (vía la API, usa el pool de la app)
    const loginSuper = await request(app).post("/api/auth/login").send({
      correo: process.env.TEST_SUPERADMIN_EMAIL,
      password: process.env.TEST_SUPERADMIN_PASSWORD,
    });
    if (loginSuper.status !== 200) {
      throw new Error(`No se pudo loguear el super_admin de prueba: ${JSON.stringify(loginSuper.body)}`);
    }
    const superAdminToken = loginSuper.body.token;

    // 3. Crear restaurante + admin vía la API real
    const adminCorreo = "admin@test-mesasmart.com";
    const adminPassword = "test123456";
    const crearRes = await request(app)
      .post("/api/super-admin/restaurantes")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        nombre: "Restaurante de Pruebas",
        slug: TEST_SLUG,
        plan: "completo",
        admin_nombre: "Admin Test",
        admin_correo: adminCorreo,
        admin_correo_personal: "admin.personal@test-mesasmart.com",
        admin_telefono: "3000000000",
        admin_password: adminPassword,
      });
    if (crearRes.status !== 201) {
      throw new Error(`No se pudo crear el restaurante de prueba: ${JSON.stringify(crearRes.body)}`);
    }
    const restauranteId = crearRes.body.id;

    // 4. Activarlo (si no, el login del admin falla con 403)
    const activarRes = await request(app)
      .patch(`/api/super-admin/restaurantes/${restauranteId}/activar`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    if (activarRes.status !== 200) {
      throw new Error(`No se pudo activar el restaurante de prueba: ${JSON.stringify(activarRes.body)}`);
    }

    // 5. Crear categorías a mano (con nuestro pool directo) — la ruta
    //    de super-admin NO las crea.
    const [catCocina] = await pool.execute(
      "INSERT INTO categorias (restaurante_id, nombre, destino) VALUES (?, ?, ?)",
      [restauranteId, "Categoria Test Cocina", "cocina"]
    );
    const [catBar] = await pool.execute(
      "INSERT INTO categorias (restaurante_id, nombre, destino) VALUES (?, ?, ?)",
      [restauranteId, "Categoria Test Bar", "bar"]
    );

    // 6. Login como el admin recién creado
    const loginAdmin = await request(app).post("/api/auth/login").send({
      correo: adminCorreo,
      password: adminPassword,
    });
    if (loginAdmin.status !== 200) {
      throw new Error(`No se pudo loguear el admin de prueba: ${JSON.stringify(loginAdmin.body)}`);
    }

    const context = {
      slug: TEST_SLUG,
      restauranteId,
      categoriaId: catCocina.insertId,
      categoriaBarId: catBar.insertId,
      superAdminToken,
      adminCorreo,
      adminPassword,
      adminToken: loginAdmin.body.token,
      adminId: loginAdmin.body.usuario.id,
    };

    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(context, null, 2));
  } finally {
    // Nuestro pool propio, nadie más lo usa — cerrarlo acá es seguro.
    await pool.end();
  }
};