const Pedido       = require("../../models/Pedido");
const { Caja }     = require("../../models/Caja");
const Mesa          = require("../../models/Mesa");
const { pool: db } = require("../../config/db");

exports.crear = async (req, res) => {
  try {
    const { mesa_id, items, observacion } = req.body;
    if (!mesa_id || !items?.length)
      return res.status(400).json({ msg: "Mesa e items requeridos." });

    // Verifica que la mesa sea del MISMO restaurante — evita crear un
    // pedido apuntando a una mesa ajena adivinando su id numérico.
    const mesa = await Mesa.findById(mesa_id, req.restaurante_id);
    if (!mesa) return res.status(404).json({ msg: "Mesa no encontrada." });

    const caja = await Caja.getAbierta(req.restaurante_id);
    const id   = await Pedido.create({
      mesa_id, caja_id: caja?.id || null, restaurante_id: req.restaurante_id, items, observacion,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[pedidos/crear]", err);
    res.status(500).json({ msg: "Error al crear pedido." });
  }
};

exports.getByMesa = async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.mesa_id, req.restaurante_id);
    if (!mesa) return res.status(404).json({ msg: "Mesa no encontrada." });
    res.json({ ok: true, pedido: await Pedido.findByMesa(req.params.mesa_id, req.restaurante_id) });
  } catch { res.status(500).json({ msg: "Error al obtener pedido." }); }
};

exports.updateItem = async (req, res) => {
  try {
    const ok = await Pedido.updateItem(req.params.item_id, req.restaurante_id, req.body.cantidad);
    if (!ok) return res.status(404).json({ msg: "Item no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error("[pedidos/updateItem]", err);
    res.status(500).json({ msg: "Error al modificar item." });
  }
};

exports.deleteItem = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { item_id } = req.params;

    // Verificar que el item existe Y pertenece a este restaurante
    const [[item]] = await conn.query(
      `SELECT dp.id, dp.pedido_id, dp.cantidad
       FROM detalle_pedido dp
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE dp.id = ? AND p.restaurante_id = ?`,
      [item_id, req.restaurante_id]
    );
    if (!item) return res.status(404).json({ msg: "Item no encontrado." });

    await conn.execute("DELETE FROM detalle_pedido WHERE id = ?", [item_id]);

    const [[totRow]] = await conn.query(
      "SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM detalle_pedido WHERE pedido_id = ?",
      [item.pedido_id]
    );
    await conn.execute("UPDATE pedidos SET total = ? WHERE id = ?", [totRow.total, item.pedido_id]);

    const [[countRow]] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM detalle_pedido WHERE pedido_id = ?",
      [item.pedido_id]
    );
    if (countRow.cnt === 0) {
      await conn.execute("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [item.pedido_id]);
      const [[ped]] = await conn.query("SELECT mesa_id FROM pedidos WHERE id = ?", [item.pedido_id]);
      if (ped) await conn.execute("UPDATE mesas SET estado = 'libre' WHERE id = ?", [ped.mesa_id]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[pedidos/deleteItem]", err);
    res.status(500).json({ msg: "Error al eliminar item." });
  } finally {
    conn.release();
  }
};

exports.moverItems = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { item_ids, mesa_destino_id } = req.body;

    if (!Array.isArray(item_ids) || item_ids.length === 0)
      return res.status(400).json({ msg: "item_ids requerido." });
    if (!mesa_destino_id)
      return res.status(400).json({ msg: "mesa_destino_id requerido." });

    await conn.beginTransaction();

    // Mesa destino DEBE ser del mismo restaurante
    const [[mesaDest]] = await conn.query(
      "SELECT id, estado FROM mesas WHERE id = ? AND restaurante_id = ?",
      [mesa_destino_id, req.restaurante_id]
    );
    if (!mesaDest) {
      await conn.rollback();
      return res.status(404).json({ msg: "Mesa destino no encontrada." });
    }

    // Los items a mover DEBEN pertenecer a pedidos de este restaurante
    const [items] = await conn.query(
      `SELECT dp.id, dp.pedido_id, dp.nombre, dp.cantidad, dp.precio,
              dp.categoria, dp.observacion, p.mesa_id AS mesa_origen_id
       FROM detalle_pedido dp
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE dp.id IN (?) AND p.restaurante_id = ?`,
      [item_ids, req.restaurante_id]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(404).json({ msg: "No se encontraron los items." });
    }

    const [[pedidoDest]] = await conn.query(
      `SELECT id FROM pedidos
       WHERE mesa_id = ? AND restaurante_id = ? AND estado IN ('pendiente', 'en_preparacion')
       ORDER BY id DESC LIMIT 1`,
      [mesa_destino_id, req.restaurante_id]
    );

    let pedidoDestinoId;
    if (pedidoDest) {
      pedidoDestinoId = pedidoDest.id;
    } else {
      const [newPed] = await conn.execute(
        "INSERT INTO pedidos (mesa_id, restaurante_id, estado, total, observacion) VALUES (?, ?, 'pendiente', 0, NULL)",
        [mesa_destino_id, req.restaurante_id]
      );
      pedidoDestinoId = newPed.insertId;
      await conn.execute("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesa_destino_id]);
    }

    for (const item of items) {
      await conn.execute("UPDATE detalle_pedido SET pedido_id = ? WHERE id = ?", [pedidoDestinoId, item.id]);
    }

    const pedidosAfectados = [...new Set(items.map(i => i.pedido_id)), pedidoDestinoId];
    for (const pedId of pedidosAfectados) {
      const [[tot]] = await conn.query(
        "SELECT COALESCE(SUM(precio * cantidad), 0) AS total FROM detalle_pedido WHERE pedido_id = ?",
        [pedId]
      );
      await conn.execute("UPDATE pedidos SET total = ? WHERE id = ?", [tot.total, pedId]);

      const [[cnt]] = await conn.query(
        "SELECT COUNT(*) AS c FROM detalle_pedido WHERE pedido_id = ?", [pedId]
      );
      if (cnt.c === 0 && pedId !== pedidoDestinoId) {
        await conn.execute("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [pedId]);
        const [[ped]] = await conn.query("SELECT mesa_id FROM pedidos WHERE id = ?", [pedId]);
        if (ped) await conn.execute("UPDATE mesas SET estado = 'libre' WHERE id = ?", [ped.mesa_id]);
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

// 👇 Este era el hueco más grave del módulo: mezclaba pedidos de TODOS los
// restaurantes en una sola lista. Ahora filtrado.
exports.getPedidos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id, p.mesa_id, p.estado, p.total, p.observacion, p.creado_en,
        m.nombre AS mesa_nombre,
        JSON_ARRAYAGG(JSON_OBJECT(
          'id', dp.id, 'nombre', dp.nombre, 'cantidad', dp.cantidad,
          'precio', dp.precio, 'categoria', dp.categoria, 'observacion', dp.observacion
        )) AS items
      FROM pedidos p
      LEFT JOIN mesas m ON m.id = p.mesa_id
      LEFT JOIN detalle_pedido dp ON dp.pedido_id = p.id
      WHERE p.estado NOT IN ('pagado', 'cancelado') AND p.restaurante_id = ?
      GROUP BY p.id
      ORDER BY p.creado_en ASC
    `, [req.restaurante_id]);

    res.json({ pedidos: rows });
  } catch (err) {
    console.error('[getPedidos]', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createPedido = exports.crear;

exports.updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ error: 'El campo "estado" es requerido' });

    const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'pagado', 'cancelado'];
    if (!estadosValidos.includes(estado))
      return res.status(400).json({ error: `Estado "${estado}" no valido` });

    const [[pedido]] = await db.query(
      'SELECT id FROM pedidos WHERE id = ? AND restaurante_id = ?', [id, req.restaurante_id]
    );
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    await db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ id: parseInt(id, 10), estado });
  } catch (err) {
    console.error('[updateEstadoPedido]', err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

exports.updateEstado = exports.updateEstadoPedido;

exports.getEstados = async (_req, res) => {
  res.json([
    { clave: 'pendiente', label: 'Pendiente', orden: 1 },
    { clave: 'en_preparacion', label: 'En preparacion', orden: 2 },
    { clave: 'listo', label: 'Listo', orden: 3 },
    { clave: 'pagado', label: 'Pagado', orden: 4 },
    { clave: 'cancelado', label: 'Cancelado', orden: 5 },
  ]);
};

exports.getCategorias = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT dp.categoria AS clave, dp.categoria AS label
       FROM detalle_pedido dp
       JOIN pedidos p ON p.id = dp.pedido_id
       WHERE dp.categoria IS NOT NULL AND p.restaurante_id = ?
       ORDER BY dp.categoria`,
      [req.restaurante_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorias' });
  }
};

exports.getCocineroTurno = async (_req, res) => {
  res.json({
    id: process.env.COCINERO_TURNO_ID || 1,
    nombre: process.env.COCINERO_TURNO_NOMBRE || 'Sin asignar',
    turno: 'mock',
  });
};