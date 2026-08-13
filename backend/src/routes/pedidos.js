const express  = require("express");
const router   = express.Router();
const { pool } = require("../config/db");
const publicTenant = require("../middlewares/publicTenantMiddleware");

router.get(["/", "/:slug"], publicTenant, async (req, res) => {
  try {
    const [pedidos] = await pool.query(`
      SELECT p.id, p.estado, p.observacion, p.creado_en, m.nombre AS mesa
      FROM pedidos p
      LEFT JOIN mesas m ON p.mesa_id = m.id
      WHERE p.estado IN ('pendiente','en_preparacion','listo') AND p.restaurante_id = ?
      ORDER BY p.creado_en ASC
    `, [req.restaurante_id]);

    if (pedidos.length === 0) return res.json([]);

    const ids = pedidos.map(p => p.id);
    const [items] = await pool.query(`
      SELECT dp.pedido_id, dp.nombre, dp.cantidad, dp.precio, dp.categoria, dp.observacion, p.imagen
      FROM detalle_pedido dp
      LEFT JOIN productos p ON p.nombre COLLATE utf8mb4_unicode_ci = dp.nombre COLLATE utf8mb4_unicode_ci
      WHERE dp.pedido_id IN (?) AND dp.categoria = 'comida'
    `, [ids]);

    const itemsMap = {};
    items.forEach(item => {
      if (!itemsMap[item.pedido_id]) itemsMap[item.pedido_id] = [];
      itemsMap[item.pedido_id].push(item);
    });

    const resultado = pedidos
      .map(p => ({ ...p, hora: p.creado_en, notas: p.observacion || "", items: itemsMap[p.id] || [] }))
      .filter(p => p.items.length > 0);

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error GET /api/pedidos-cocina:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

router.post(["/", "/:slug"], publicTenant, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { mesa_id, mesa_nombre, items, observacion } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "El pedido no tiene items" });

    let mesaId = mesa_id;
    if (!mesaId && mesa_nombre) {
      const [mesas] = await conn.query(
        "SELECT id FROM mesas WHERE nombre = ? AND restaurante_id = ? LIMIT 1",
        [mesa_nombre, req.restaurante_id]
      );
      if (mesas.length > 0) {
        mesaId = mesas[0].id;
      } else {
        const [nueva] = await conn.execute(
          "INSERT INTO mesas (nombre, estado, restaurante_id) VALUES (?, 'ocupada', ?)",
          [mesa_nombre, req.restaurante_id]
        );
        mesaId = nueva.insertId;
      }
    }

    if (!mesaId) return res.status(400).json({ error: "Mesa requerida" });

    const total = items.reduce((acc, i) => acc + (Number(i.precio) * Number(i.cantidad)), 0);

    const [pedidoResult] = await conn.execute(
      `INSERT INTO pedidos (mesa_id, estado, total, observacion) VALUES (?, 'pendiente', ?, ?)`,
      [mesaId, total, observacion || null]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO detalle_pedido (pedido_id, nombre, cantidad, precio, categoria, observacion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, item.nombre, item.cantidad || 1, item.precio || 0, item.categoria || "comida", item.observacion || item.notas || null]
      );
    }

    await conn.execute("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesaId]);
    await conn.commit();
    res.json({ ok: true, pedido_id: pedidoId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error POST /api/pedidos-cocina:", err);
    res.status(500).json({ error: "Error al crear pedido" });
  } finally {
    conn.release();
  }
});

// PATCH /:id/estado — se queda igual, no toca mesas ni necesita tenant todavía
// (pedidos aún no está migrado; queda pendiente para ese módulo)
router.patch(["/:id/estado", "/:slug/:id/estado"], publicTenant, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { estado } = req.body;
    const validos = ["pendiente", "en_preparacion", "listo", "pagado", "cancelado"];
    if (!validos.includes(estado))
      return res.status(400).json({ error: "Estado inválido" });

    await conn.beginTransaction();
    const [r] = await conn.execute(
      "UPDATE pedidos SET estado = ? WHERE id = ? AND restaurante_id = ?",
      [estado, req.params.id, req.restaurante_id]
    );
    await conn.commit();
    if (r.affectedRows === 0) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error PATCH /api/pedidos-cocina/:id/estado:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  } finally { conn.release(); }
});

module.exports = router;