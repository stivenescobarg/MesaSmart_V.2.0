// tests/integration/globalTeardown.js
// Corre UNA sola vez después de toda la suite de integración. Borra por
// completo el restaurante de prueba (y todo lo que cuelga de él) para
// que Aiven no acumule basura entre corridas. Usa su propio pool
// aislado (dbDirect.js), independiente del que arma la app.

require("dotenv").config({ path: ".env.test" });
const fs = require("fs");
const path = require("path");
const { crearPoolDirecto } = require("./helpers/dbDirect");

const CONTEXT_FILE = path.join(__dirname, ".test-context.json");

module.exports = async () => {
  if (!fs.existsSync(CONTEXT_FILE)) return;

  const { restauranteId } = JSON.parse(fs.readFileSync(CONTEXT_FILE, "utf-8"));
  const pool = crearPoolDirecto();

  try {
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

    fs.unlinkSync(CONTEXT_FILE);
  } finally {
    // Nuestro pool propio, nadie más lo usa — cerrarlo acá es seguro.
    await pool.end();
  }
};