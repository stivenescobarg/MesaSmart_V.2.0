const Zona = require("../../models/Zona");

exports.getAll = async (req, res) => {
  try {
    res.json({ ok: true, zonas: await Zona.findAll(req.restaurante_id) });
  } catch { res.status(500).json({ msg: "Error al obtener zonas." }); }
};

exports.create = async (req, res) => {
  try {
    const { nombre, color, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ msg: "El nombre es requerido." });
    const id = await Zona.create({ restaurante_id: req.restaurante_id, nombre: nombre.trim(), color, orden });
    res.status(201).json({ ok: true, id });
  } catch { res.status(500).json({ msg: "Error al crear zona." }); }
};

exports.update = async (req, res) => {
  try {
    const { nombre, color, orden } = req.body;
    const ok = await Zona.update(req.params.id, req.restaurante_id, { nombre, color, orden });
    if (!ok) return res.status(404).json({ msg: "Zona no encontrada." });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar zona." }); }
};

exports.remove = async (req, res) => {
  try {
    const ok = await Zona.delete(req.params.id, req.restaurante_id);
    if (!ok) return res.status(404).json({ msg: "Zona no encontrada." });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al eliminar zona." }); }
};