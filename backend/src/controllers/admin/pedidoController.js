const { pool: db } = require('../../config/db');

// ─────────────────────────────────────────────
// GET /api/pedidos
// Retorna pedidos activos (excluyendo entregados y cancelados)
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
          m.numero         AS mesa,
          p.estado_id,
          e.clave          AS estado,
          e.label          AS estado_label,
          e.orden          AS estado_orden,
          p.notas,
          p.created_at     AS hora,
          p.updated_at
        FROM cocina_pedidos p
        JOIN cocina_mesas   m ON m.id = p.mesa_id
        JOIN cocina_estados e ON e.id = p.estado_id
        WHERE ${whereClause}
        ORDER BY e.orden ASC, p.created_at ASC`,
      params
    );

    if (rows.length === 0) return res.json([]);

    const pedidoIds = rows.map(r => r.id);
    const [items] = await db.query(
      `SELECT
          pi.id,
          pi.pedido_id,
          pi.nombre,
          pi.cantidad,
          pi.notas,
          pi.precio,
          c.id             AS categoria_id,
          c.clave          AS categoria,
          c.label          AS categoria_label,
          c.icono          AS categoria_icono
        FROM cocina_pedido_items pi
        JOIN cocina_categorias c ON c.id = pi.categoria_id
        WHERE pi.pedido_id IN (?)
        ORDER BY c.id ASC, pi.id ASC`,
      [pedidoIds]
    );

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

    // Validar en cocina_mesas
    const [[mesa]] = await conn.query(
      'SELECT id FROM cocina_mesas WHERE id = ? AND activa = TRUE',
      [mesa_id]
    );
    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada o inactiva' });
    }

    // Insertar en cocina_pedidos
    const [result] = await conn.query(
      'INSERT INTO cocina_pedidos (mesa_id, estado_id, notas) VALUES (?, 1, ?)',
      [mesa_id, notas]
    );
    const pedidoId = result.insertId;

    const itemValues = items.map(item => [
      pedidoId,
      item.categoria_id || 1,
      item.nombre,
      item.cantidad || 1,
      item.notas || null,
      item.precio || null,
    ]);

    // Insertar en cocina_pedido_items
    await conn.query(
      `INSERT INTO cocina_pedido_items (pedido_id, categoria_id, nombre, cantidad, notas, precio)
       VALUES ?`,
      [itemValues]
    );

    await conn.commit();
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
// ─────────────────────────────────────────────
const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El campo "estado" es requerido' });
    }

    // Buscar en cocina_estados
    const [[estadoRow]] = await db.query(
      'SELECT id, clave, label FROM cocina_estados WHERE clave = ? AND activo = TRUE',
      [estado]
    );
    if (!estadoRow) {
      return res.status(400).json({ error: `Estado "${estado}" no válido` });
    }

    // Verificar en cocina_pedidos
    const [[pedido]] = await db.query(
      'SELECT id, estado_id FROM cocina_pedidos WHERE id = ?',
      [id]
    );
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    await db.query(
      'UPDATE cocina_pedidos SET estado_id = ? WHERE id = ?',
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
// ─────────────────────────────────────────────
const getEstados = async (_req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, clave, label, orden FROM cocina_estados WHERE activo = TRUE ORDER BY orden'
    );
    res.json(rows);
  } catch (err) {
    console.error('[getEstados]', err);
    res.status(500).json({ error: 'Error al obtener estados' });
  }
};

// ─────────────────────────────────────────────
// GET /api/categorias
// ─────────────────────────────────────────────
const getCategorias = async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT id, clave, label, icono FROM cocina_categorias');
    res.json(rows);
  } catch (err) {
    console.error('[getCategorias]', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const getCocineroTurno = async (_req, res) => {
  res.json({
    id:      process.env.COCINERO_TURNO_ID   || 1,
    nombre:  process.env.COCINERO_TURNO_NOMBRE || 'Sin asignar',
    turno:   'mock',
  });
};

module.exports = {
  getPedidos,
  createPedido,
  updateEstadoPedido,
  getEstados,
  getCategorias,
  getCocineroTurno,
  // aliases para las rutas del equipo
  crear:         createPedido,
  getByMesa:     getPedidos,
  updateEstado:  updateEstadoPedido,
  updateItem:    updateEstadoPedido,
};