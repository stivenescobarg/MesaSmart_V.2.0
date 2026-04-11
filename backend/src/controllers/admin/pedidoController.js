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

exports.updateItem = async (req, res) => {
  try {
    await Pedido.updateItem(req.params.item_id, req.body.cantidad);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al modificar item." }); }
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