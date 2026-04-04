// backend/src/models/Pedido.js
const { pool } = require("../config/db");

const Pedido = {
  create: async ({ mesa_id, caja_id, items, observacion }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const total = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
      const [r] = await conn.execute(
        "INSERT INTO pedidos (mesa_id,caja_id,total,observacion) VALUES (?,?,?,?)",
        [mesa_id, caja_id || null, total, observacion || null]);
      const pedido_id = r.insertId;

      for (const item of items) {
        await conn.execute(
          "INSERT INTO detalle_pedido (pedido_id,nombre,cantidad,precio,categoria,observacion) VALUES (?,?,?,?,?,?)",
          [pedido_id, item.nombre, item.cantidad, item.precio,
           item.categoria || "comida", item.observacion || null]);
      }
      await conn.execute(
        "UPDATE mesas SET estado='ocupada' WHERE id=?", [mesa_id]);
      await conn.commit();
      return pedido_id;
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  findById: async (id) => {
    const [p] = await pool.execute("SELECT * FROM pedidos WHERE id=? LIMIT 1", [id]);
    if (!p[0]) return null;
    const [items] = await pool.execute(
      "SELECT * FROM detalle_pedido WHERE pedido_id=?", [id]);
    return { ...p[0], items };
  },

  findByMesa: async (mesa_id) => {
    const [r] = await pool.execute(
      `SELECT p.id as pedido_id, p.estado, p.total, p.observacion,
              dp.id as item_id, dp.nombre, dp.cantidad, dp.precio,
              dp.categoria, dp.observacion as item_obs
       FROM pedidos p JOIN detalle_pedido dp ON dp.pedido_id=p.id
       WHERE p.mesa_id=? AND p.estado NOT IN ('pagado','cancelado')
       ORDER BY p.creado_en`, [mesa_id]);
    return r;
  },

  updateEstado: async (id, estado) => {
    await pool.execute("UPDATE pedidos SET estado=? WHERE id=?", [estado, id]);
  },

  updateItem: async (item_id, cantidad) => {
    if (cantidad <= 0) {
      const [r] = await pool.execute(
        "SELECT pedido_id FROM detalle_pedido WHERE id=?", [item_id]);
      await pool.execute("DELETE FROM detalle_pedido WHERE id=?", [item_id]);
      if (r[0]) await recalcularTotal(r[0].pedido_id);
    } else {
      const [r] = await pool.execute(
        "UPDATE detalle_pedido SET cantidad=? WHERE id=? RETURNING pedido_id",
        [cantidad, item_id]);
      await pool.execute(
        "UPDATE detalle_pedido SET cantidad=? WHERE id=?", [cantidad, item_id]);
      const [rows] = await pool.execute(
        "SELECT pedido_id FROM detalle_pedido WHERE id=?", [item_id]);
      if (rows[0]) await recalcularTotal(rows[0].pedido_id);
    }
  },
};

const recalcularTotal = async (pedido_id) => {
  await pool.execute(
    `UPDATE pedidos SET total=
     (SELECT COALESCE(SUM(cantidad*precio),0) FROM detalle_pedido WHERE pedido_id=?)
     WHERE id=?`, [pedido_id, pedido_id]);
};

module.exports = Pedido;