// backend/src/controllers/admin/pedidoController.js
const Pedido       = require("../../models/Pedido");
const { Caja }     = require("../../models/Caja");
const { pool: db } = require("../../config/db");

exports.crear = async (req, res) => {
  try {
    const { mesa_id, items, observacion } = req.body;
    if (!mesa_id || !items?.length)
      return res.status(400).json({ msg: "Mesa e items requeridos." });
    const caja = await Caja.getAbierta();
    const id   = await Pedido.create({ mesa_id, caja_id: caja?.id || null, items, observacion });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[pedidos/crear]", err);
    res.status(500).json({ msg: "Error al crear pedido." });
  }
};

exports.getByMesa = async (req, res) => {
  try { res.json({ ok: true, pedido: await Pedido.findByMesa(req.params.mesa_id) }); }
  catch { res.status(500).json({ msg: "Error al obtener pedido." }); }
};

// PATCH /api/pedidos/items/:item_id  — modificar cantidad
exports.updateItem = async (req, res) => {
  try {
    await Pedido.updateItem(req.params.item_id, req.body.cantidad);
    res.json({ ok: true });
  } catch (err) {
    console.error("[pedidos/updateItem]", err);
    res.status(500).json({ msg: "Error al modificar item." });
  }
};

// DELETE /api/pedidos/items/:item_id — eliminar item (requiere PIN en el front)
exports.deleteItem = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { item_id } = req.params;

    // Verificar que el item existe
    const [[item]] = await conn.query(
      "SELECT id, pedido_id, cantidad FROM detalle_pedido WHERE id = ?",
      [item_id]
    );
    if (!item) return res.status(404).json({ msg: "Item no encontrado." });

    // Eliminar el item
    await conn.execute("DELETE FROM detalle_pedido WHERE id = ?", [item_id]);

    // Recalcular total del pedido
    const [[totRow]] = await conn.query(
      "SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM detalle_pedido WHERE pedido_id = ?",
      [item.pedido_id]
    );
    await conn.execute(
      "UPDATE pedidos SET total = ? WHERE id = ?",
      [totRow.total, item.pedido_id]
    );

    // Si el pedido quedó sin items, cerrarlo y liberar mesa
    const [[countRow]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM detalle_pedido WHERE pedido_id = ?",
      [item.pedido_id]
    );
    if (countRow.cnt === 0) {
      await conn.execute(
        "UPDATE pedidos SET estado = 'cancelado' WHERE id = ?",
        [item.pedido_id]
      );
      // Obtener mesa_id para liberarla
      const [[ped]] = await conn.query(
        "SELECT mesa_id FROM pedidos WHERE id = ?",
        [item.pedido_id]
      );
      if (ped) {
        await conn.execute(
          "UPDATE mesas SET estado = 'libre' WHERE id = ?",
          [ped.mesa_id]
        );
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[pedidos/deleteItem]", err);
    res.status(500).json({ msg: "Error al eliminar item." });
  } finally {
    conn.release();
  }
};

// PATCH /api/pedidos/items/mover — mover items a otra mesa
exports.moverItems = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { item_ids, mesa_destino_id } = req.body;

    if (!Array.isArray(item_ids) || item_ids.length === 0)
      return res.status(400).json({ msg: "item_ids requerido." });
    if (!mesa_destino_id)
      return res.status(400).json({ msg: "mesa_destino_id requerido." });

    await conn.beginTransaction();

    // Verificar que la mesa destino existe
    const [[mesaDest]] = await conn.query(
      "SELECT id, estado FROM mesas WHERE id = ?",
      [mesa_destino_id]
    );
    if (!mesaDest) {
      await conn.rollback();
      return res.status(404).json({ msg: "Mesa destino no encontrada." });
    }

    // Obtener info de los items a mover (para saber su pedido origen)
    const [items] = await conn.query(
      `SELECT dp.id, dp.pedido_id, dp.nombre, dp.cantidad, dp.precio,
              dp.categoria, dp.observacion, p.mesa_id AS mesa_origen_id
       FROM detalle_pedido dp
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE dp.id IN (?)`,
      [item_ids]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(404).json({ msg: "No se encontraron los items." });
    }

    // Buscar o crear pedido activo en la mesa destino
    const [[pedidoDest]] = await conn.query(
      `SELECT id FROM pedidos
       WHERE mesa_id = ? AND estado IN ('pendiente', 'en_preparacion')
       ORDER BY id DESC LIMIT 1`,
      [mesa_destino_id]
    );

    let pedidoDestinoId;
    if (pedidoDest) {
      pedidoDestinoId = pedidoDest.id;
    } else {
      // Crear nuevo pedido en la mesa destino
      const [newPed] = await conn.execute(
        "INSERT INTO pedidos (mesa_id, estado, total, observacion) VALUES (?, 'pendiente', 0, NULL)",
        [mesa_destino_id]
      );
      pedidoDestinoId = newPed.insertId;

      // Marcar mesa destino como ocupada
      await conn.execute(
        "UPDATE mesas SET estado = 'ocupada' WHERE id = ?",
        [mesa_destino_id]
      );
    }

    // Mover cada item al pedido destino
    for (const item of items) {
      await conn.execute(
        "UPDATE detalle_pedido SET pedido_id = ? WHERE id = ?",
        [pedidoDestinoId, item.id]
      );
    }

    // Recalcular totales: pedido origen y destino
    const pedidosAfectados = [...new Set(items.map(i => i.pedido_id)), pedidoDestinoId];
    for (const pedId of pedidosAfectados) {
      const [[tot]] = await conn.query(
        "SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM detalle_pedido WHERE pedido_id = ?",
        [pedId]
      );
      await conn.execute("UPDATE pedidos SET total = ? WHERE id = ?", [tot.total, pedId]);

      // Si el pedido origen quedó sin items, cancelarlo y liberar mesa
      const [[cnt]] = await conn.query(
        "SELECT COUNT(*) AS c FROM detalle_pedido WHERE pedido_id = ?",
        [pedId]
      );
      if (cnt.c === 0 && pedId !== pedidoDestinoId) {
        await conn.execute(
          "UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [pedId]
        );
        const [[ped]] = await conn.query(
          "SELECT mesa_id FROM pedidos WHERE id = ?", [pedId]
        );
        if (ped) {
          await conn.execute(
            "UPDATE mesas SET estado = 'libre' WHERE id = ?", [ped.mesa_id]
          );
        }
      }
    }

    await conn.commit();
    res.json({ ok: true, pedido_destino_id: pedidoDestinoId });
  } catch (err) {
    await conn.rollback();
    console.error("[pedidos/moverItems]", err);
    res.status(500).json({ msg: "Error al mover items." });
  } finally {
    conn.release();
  }
};

exports.getPedidos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.mesa_id, e.clave AS estado, p.created_at,
        m.numero AS mesa_numero,
        JSON_ARRAYAGG(JSON_OBJECT(
          'id', i.id, 'nombre', i.nombre,
          'cantidad', i.cantidad, 'nota', i.nota,
          'categoria', c.clave
        )) AS items
      FROM cocina_pedidos p
      JOIN cocina_mesas   m ON m.id = p.mesa_id
      JOIN cocina_estados e ON e.id = p.estado_id
      JOIN cocina_pedido_items i ON i.pedido_id = p.id
      JOIN cocina_categorias   c ON c.id = i.categoria_id
      WHERE e.clave != 'entregado'
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `);
    res.json({ pedidos: rows });
  } catch (err) {
    console.error('[getPedidos]', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createPedido = exports.crear;

exports.updateEstadoPedido = async (req, res) => {
  try {
    const { id }     = req.params;
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'El campo "estado" es requerido' });
    const [[estadoRow]] = await db.query(
      'SELECT id, clave, label FROM cocina_estados WHERE clave = ? AND activo = TRUE', [estado]
    );
    if (!estadoRow) return res.status(400).json({ error: `Estado "${estado}" no válido` });
    const [[pedido]] = await db.query('SELECT id FROM cocina_pedidos WHERE id = ?', [id]);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    await db.query('UPDATE cocina_pedidos SET estado_id = ? WHERE id = ?', [estadoRow.id, id]);
    res.json({ id: parseInt(id), estado: estadoRow.clave });
  } catch (err) {
    console.error('[updateEstadoPedido]', err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

exports.updateEstado = exports.updateEstadoPedido;

exports.getEstados = async (_req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, clave, label, orden FROM cocina_estados WHERE activo = TRUE ORDER BY orden'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener estados' }); }
};

exports.getCategorias = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, clave, label, icono FROM cocina_categorias');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener categorías' }); }
};

exports.getCocineroTurno = async (_req, res) => {
  res.json({
    id:     process.env.COCINERO_TURNO_ID     || 1,
    nombre: process.env.COCINERO_TURNO_NOMBRE || 'Sin asignar',
    turno:  'mock',
  });
};