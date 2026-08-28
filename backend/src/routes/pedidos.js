// backend/src/routes/pedidos.js
const express  = require("express");
const router   = express.Router();
const { pool } = require("../config/db");
const auth     = require("../middlewares/authMiddleware");

// GET /api/pedidos-cocina — pedidos con ítems de comida
// 👇 SaaS: ruta PROTEGIDA. Solo trae pedidos DEL restaurante del
// cocinero logueado (nunca de otro restaurante), tomando el
// restaurante_id del token, nunca de query params ni del body.
router.get("/", auth, async (req, res) => {
  try {
    const restauranteId = req.usuario.restaurante_id;

    const [pedidos] = await pool.query(`
      SELECT
        p.id,
        p.estado,
        p.observacion,
        p.creado_en,
        p.restaurante_id,
        m.nombre AS mesa,
        r.nombre AS restaurante
      FROM pedidos p
      LEFT JOIN mesas m        ON p.mesa_id = m.id
      LEFT JOIN restaurantes r ON p.restaurante_id = r.id
      WHERE p.estado IN ('pendiente','en_preparacion','listo')
        AND p.restaurante_id = ?
      ORDER BY p.creado_en ASC
    `, [restauranteId]);

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
// Ruta PÚBLICA: la usa el cliente sin login (viene del QR de la mesa).
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 👇 el cambio clave: leemos restaurante_id, que Menu.jsx ya está mandando
    const { mesa_id, mesa_nombre, items, observacion, restaurante_id } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ error: "El pedido no tiene items" });

    if (!restaurante_id)
      return res.status(400).json({ error: "restaurante_id requerido" });

    let mesaId = mesa_id;
    if (!mesaId && mesa_nombre) {
      // 👇 al buscar/crear la mesa, también la filtramos/asociamos por restaurante,
      // así el número "5" del restaurante 1 no se confunde con el "5" del restaurante 2
      const [mesas] = await conn.query(
        "SELECT id FROM mesas WHERE nombre = ? AND restaurante_id = ? LIMIT 1",
        [mesa_nombre, restaurante_id]
      );
      if (mesas.length > 0) {
        mesaId = mesas[0].id;
      } else {
        const [nueva] = await conn.execute(
          "INSERT INTO mesas (nombre, estado, restaurante_id) VALUES (?, 'ocupada', ?)",
          [mesa_nombre, restaurante_id]
        );
        mesaId = nueva.insertId;
      }
    }

    if (!mesaId) return res.status(400).json({ error: "Mesa requerida" });

    const total = items.reduce(
      (acc, i) => acc + (Number(i.precio) * Number(i.cantidad)), 0
    );

    // 👇 el otro cambio clave: restaurante_id ahora sí viaja en el INSERT
    const [pedidoResult] = await conn.execute(
      `INSERT INTO pedidos (mesa_id, restaurante_id, estado, total, observacion)
       VALUES (?, ?, 'pendiente', ?, ?)`,
      [mesaId, restaurante_id, total, observacion || null]
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
// 👇 SaaS: ruta PROTEGIDA. Antes de cambiar el estado, verificamos que
// el pedido pertenezca al restaurante del cocinero logueado — así nadie
// puede avanzar/cerrar pedidos de un restaurante que no es el suyo,
// ni adivinando el id.
router.patch("/:id/estado", auth, async (req, res) => {
  try {
    const restauranteId = req.usuario.restaurante_id;

console.log("🍳 USUARIO COCINA:", req.usuario);
console.log("🏠 RESTAURANTE DEL TOKEN:", restauranteId);
    const { estado } = req.body;
    const validos = ["pendiente", "en_preparacion", "listo", "pagado", "cancelado"];
    if (!validos.includes(estado))
      return res.status(400).json({ error: "Estado inválido" });

    const [[pedido]] = await pool.query(
      "SELECT id FROM pedidos WHERE id = ? AND restaurante_id = ?",
      [req.params.id, restauranteId]
    );
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado en tu restaurante." });
    }

    await pool.execute(
      "UPDATE pedidos SET estado = ? WHERE id = ? AND restaurante_id = ?",
      [estado, req.params.id, restauranteId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PATCH /api/pedidos-cocina/:id/estado:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

module.exports = router;