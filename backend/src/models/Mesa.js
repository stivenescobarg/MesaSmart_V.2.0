// backend/src/models/Mesa.js
const { pool } = require("../config/db");

const Mesa = {
  findAll: async () => {
    const [mesas] = await pool.execute(
      "SELECT * FROM mesas WHERE activa=TRUE ORDER BY id");

    for (const m of mesas) {
      const [items] = await pool.execute(
        `SELECT dp.id as item_id, dp.nombre, dp.cantidad, dp.precio,
                dp.categoria, dp.observacion, p.id as pedido_id, p.estado, p.total
         FROM pedidos p
         JOIN detalle_pedido dp ON dp.pedido_id = p.id
         WHERE p.mesa_id=? AND p.estado NOT IN ('pagado','cancelado')
         ORDER BY p.creado_en`, [m.id]);
      m.pedido  = items;
      m.ocupada = items.length > 0;
      m.total   = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
    }
    return mesas;
  },
  findById: async (id) => {
    const [r] = await pool.execute(
      "SELECT * FROM mesas WHERE id=? AND activa=TRUE LIMIT 1", [id]);
    return r[0] || null;
  },
  create: async (nombre) => {
    const [r] = await pool.execute(
      "INSERT INTO mesas (nombre) VALUES (?)", [nombre]);
    return r.insertId;
  },
  updateEstado: async (id, estado) => {
    await pool.execute("UPDATE mesas SET estado=? WHERE id=?", [estado, id]);
  },
  delete: async (id) => {
    await pool.execute("UPDATE mesas SET activa=FALSE WHERE id=?", [id]);
  },
};

module.exports = Mesa;