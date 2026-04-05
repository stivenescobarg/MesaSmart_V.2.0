// backend/src/controllers/admin/mesaController.js
const Mesa = require("../../models/Mesa");

exports.getAll = async (req, res) => {
  try { res.json({ ok: true, mesas: await Mesa.findAll() }); }
  catch { res.status(500).json({ msg: "Error al obtener mesas." }); }
};
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ msg: "Nombre requerido." });
    const id = await Mesa.create(nombre);
    res.status(201).json({ ok: true, id });
  } catch { res.status(500).json({ msg: "Error al crear mesa." }); }
};
exports.remove = async (req, res) => {
  try {
    const m = await Mesa.findById(req.params.id);
    if (!m) return res.status(404).json({ msg: "Mesa no encontrada." });
    if (m.ocupada) return res.status(409).json({ msg: "Mesa tiene pedidos activos." });
    await Mesa.delete(req.params.id);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al eliminar mesa." }); }
};
exports.updateEstado = async (req, res) => {
  try {
    await Mesa.updateEstado(req.params.id, req.body.estado);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar mesa." }); }
};