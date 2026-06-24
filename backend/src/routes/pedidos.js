// backend/src/routes/pedidos.js
const express  = require("express");
const router   = express.Router();
const { pool } = require("../config/db");

// GET /api/pedidos-cocina — pedidos con ítems de comida
router.get("/", async (req, res) => {
  try {
    const [pedidos] = await pool.query(`
      SELECT
        p.id,
        p.estado,
        p.observacion,
        p.creado_en,
        m.nombre AS mesa
      FROM pedidos p
      LEFT JOIN mesas m ON p.mesa_id = m.id
      WHERE p.estado IN ('pendiente','en_preparacion','listo')
      ORDER BY p.creado_en ASC
    `);

    if (pedidos.length === 0) return res.json([]);

    const ids = pedidos.map(p => p.id);

    // ── imagen removida: la columna no existe en detalle_pedido ──
    // Si la agregas con ALTER TABLE, puedes volver a incluirla aquí
    const [items] = await pool.query(`
      SELECT
        pedido_id,
        nombre,
        cantidad,
        precio,
        categoria,
        observacion
      FROM detalle_pedido
      WHERE pedido_id IN (?) AND categoria = 'comida'
    `, [ids]);

    const itemsMap = {};
    items.forEach(item => {
      if (!itemsMap[item.pedido_id]) itemsMap[item.pedido_id] = [];
      // imagen null por defecto hasta que se agregue la columna a la BD
      itemsMap[item.pedido_id].push({ ...item, imagen: null });
    });

    const resultado = pedidos
      .map(p => ({
        ...p,
        hora:  p.creado_en,
        notas: p.observacion || "",
        items: itemsMap[p.id] || [],
      }))
      .filter(p => p.items.length > 0);

    res.json(resultado);
  } catch (err) {
    console.error("❌ Error GET /api/pedidos-cocina:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// POST /api/pedidos-cocina — crear pedido desde el menú
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { mesa_id, mesa_nombre, items, observacion } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "El pedido no tiene items" });

    let mesaId = mesa_id;
    if (!mesaId && mesa_nombre) {
      const [mesas] = await conn.query(
        "SELECT id FROM mesas WHERE nombre = ? LIMIT 1", [mesa_nombre]
      );
      if (mesas.length > 0) {
        mesaId = mesas[0].id;
      } else {
        const [nueva] = await conn.execute(
          "INSERT INTO mesas (nombre, estado) VALUES (?, 'ocupada')", [mesa_nombre]
        );
        mesaId = nueva.insertId;
      }
    }

    if (!mesaId) return res.status(400).json({ error: "Mesa requerida" });

    const total = items.reduce(
      (acc, i) => acc + (Number(i.precio) * Number(i.cantidad)), 0
    );

    const [pedidoResult] = await conn.execute(
      `INSERT INTO pedidos (mesa_id, estado, total, observacion)
       VALUES (?, 'pendiente', ?, ?)`,
      [mesaId, total, observacion || null]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO detalle_pedido
          (pedido_id, nombre, cantidad, precio, categoria, observacion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          pedidoId,
          item.nombre,
          item.cantidad || 1,
          item.precio   || 0,
          item.categoria || "comida",
          item.observacion || item.notas || null,
        ]
      );
    }

    await conn.execute(
      "UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesaId]
    );

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

// PATCH /api/pedidos-cocina/:id/estado
router.patch("/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    const validos = ["pendiente", "en_preparacion", "listo", "pagado", "cancelado"];
    if (!validos.includes(estado))
      return res.status(400).json({ error: "Estado inválido" });

    await pool.execute(
      "UPDATE pedidos SET estado = ? WHERE id = ?", [estado, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PATCH /api/pedidos-cocina/:id/estado:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

module.exports = router;