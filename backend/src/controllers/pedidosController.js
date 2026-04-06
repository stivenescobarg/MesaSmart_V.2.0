const db = require('../config/mysqlDb');

// ─────────────────────────────────────────────
// GET /api/pedidos
// Retorna pedidos activos (excluyendo entregados y cancelados)
// Query param: ?estado=pendiente  (opcional, filtra por estado)
// ─────────────────────────────────────────────
const getPedidos = async (req, res) => {
  try {
    const { estado } = req.query;

    let whereClause = `e.clave NOT IN ('entregado', 'cancelado')`;
    const params = [];

    if (estado) {
      whereClause = `e.clave = ?`;
      params.push(estado);
    }

    const [rows] = await db.query(
      `SELECT
         p.id,
         p.mesa_id,
         m.numero        AS mesa,
         p.estado_id,
         e.clave         AS estado,
         e.label         AS estado_label,
         e.orden         AS estado_orden,
         p.notas,
         p.created_at    AS hora,
         p.updated_at
       FROM pedidos p
       JOIN mesas   m ON m.id = p.mesa_id
       JOIN estados e ON e.id = p.estado_id
       WHERE ${whereClause}
       ORDER BY e.orden ASC, p.created_at ASC`,
      params
    );

    if (rows.length === 0) return res.json([]);

    // Traer los items de todos esos pedidos en una sola query
    const pedidoIds = rows.map(r => r.id);
    const [items] = await db.query(
      `SELECT
         pi.id,
         pi.pedido_id,
         pi.nombre,
         pi.cantidad,
         pi.notas,
         pi.precio,
         c.id            AS categoria_id,
         c.clave         AS categoria,
         c.label         AS categoria_label,
         c.icono         AS categoria_icono
       FROM pedido_items pi
       JOIN categorias c ON c.id = pi.categoria_id
       WHERE pi.pedido_id IN (?)
       ORDER BY c.id ASC, pi.id ASC`,
      [pedidoIds]
    );

    // Agrupar items por pedido
    const itemsMap = items.reduce((acc, item) => {
      if (!acc[item.pedido_id]) acc[item.pedido_id] = [];
      acc[item.pedido_id].push({
        id:              item.id,
        nombre:          item.nombre,
        cantidad:        item.cantidad,
        notas:           item.notas || '',
        precio:          item.precio,
        categoria:       item.categoria,
        categoria_label: item.categoria_label,
        categoria_icono: item.categoria_icono,
      });
      return acc;
    }, {});

    const pedidos = rows.map(p => ({
      id:           p.id,
      mesa:         p.mesa,
      mesa_id:      p.mesa_id,
      estado:       p.estado,
      estado_label: p.estado_label,
      estado_orden: p.estado_orden,
      notas:        p.notas || '',
      hora:         p.hora,
      updated_at:   p.updated_at,
      items:        itemsMap[p.id] || [],
    }));

    res.json(pedidos);
  } catch (err) {
    console.error('[getPedidos]', err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// ─────────────────────────────────────────────
// POST /api/pedidos
// Crea un nuevo pedido con sus items
// Body: { mesa_id, notas?, items: [{ nombre, cantidad, categoria_id, notas?, precio? }] }
// ─────────────────────────────────────────────
const createPedido = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { mesa_id, notas = null, items = [] } = req.body;

    if (!mesa_id) {
      return res.status(400).json({ error: 'mesa_id es requerido' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
    }

    // Validar que la mesa exista y esté activa
    const [[mesa]] = await conn.query(
      'SELECT id FROM mesas WHERE id = ? AND activa = TRUE',
      [mesa_id]
    );
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada o inactiva' });
    }

    // Insertar pedido (estado_id 1 = pendiente)
    const [result] = await conn.query(
      'INSERT INTO pedidos (mesa_id, estado_id, notas) VALUES (?, 1, ?)',
      [mesa_id, notas]
    );
    const pedidoId = result.insertId;

    // Insertar items
    const itemValues = items.map(item => [
      pedidoId,
      item.categoria_id || 1,
      item.nombre,
      item.cantidad || 1,
      item.notas || null,
      item.precio || null,
    ]);

    await conn.query(
      `INSERT INTO pedido_items (pedido_id, categoria_id, nombre, cantidad, notas, precio)
       VALUES ?`,
      [itemValues]
    );

    await conn.commit();

    // Retornar el pedido recién creado
    res.status(201).json({ id: pedidoId, message: 'Pedido creado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error('[createPedido]', err);
    res.status(500).json({ error: 'Error al crear el pedido' });
  } finally {
    conn.release();
  }
};

// ─────────────────────────────────────────────
// PATCH /api/pedidos/:id/estado
// Actualiza el estado de un pedido
// Body: { estado: 'en_preparacion' }
// ─────────────────────────────────────────────
const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El campo "estado" es requerido' });
    }

    // Buscar el estado
    const [[estadoRow]] = await db.query(
      'SELECT id, clave, label FROM estados WHERE clave = ? AND activo = TRUE',
      [estado]
    );
    if (!estadoRow) {
      return res.status(400).json({ error: `Estado "${estado}" no válido` });
    }

    // Verificar que el pedido existe
    const [[pedido]] = await db.query(
      'SELECT id, estado_id FROM pedidos WHERE id = ?',
      [id]
    );
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    await db.query(
      'UPDATE pedidos SET estado_id = ? WHERE id = ?',
      [estadoRow.id, id]
    );

    res.json({
      id:      parseInt(id),
      estado:  estadoRow.clave,
      message: `Estado actualizado a "${estadoRow.label}"`,
    });
  } catch (err) {
    console.error('[updateEstadoPedido]', err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

// ─────────────────────────────────────────────
// GET /api/estados
// Lista todos los estados disponibles
// ─────────────────────────────────────────────
const getEstados = async (_req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, clave, label, orden FROM estados WHERE activo = TRUE ORDER BY orden'
    );
    res.json(rows);
  } catch (err) {
    console.error('[getEstados]', err);
    res.status(500).json({ error: 'Error al obtener estados' });
  }
};

// ─────────────────────────────────────────────
// GET /api/categorias
// Lista las categorías de items
// ─────────────────────────────────────────────
const getCategorias = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, clave, label, icono FROM categorias');
    res.json(rows);
  } catch (err) {
    console.error('[getCategorias]', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// ─────────────────────────────────────────────
// GET /api/turno/cocinero
// Retorna info del cocinero en turno (mock por ahora)
// En el futuro: JOIN con tabla turnos
// ─────────────────────────────────────────────
const getCocineroTurno = async (_req, res) => {
  // TODO: cuando se implemente tabla de turnos, hacer query aquí
  res.json({
    id:     process.env.COCINERO_TURNO_ID   || 1,
    nombre: process.env.COCINERO_TURNO_NOMBRE || 'Sin asignar',
    turno:  'mock', // indicador de que es temporal
  });
};

module.exports = {
  getPedidos,
  createPedido,
  updateEstadoPedido,
  getEstados,
  getCategorias,
  getCocineroTurno,
};
