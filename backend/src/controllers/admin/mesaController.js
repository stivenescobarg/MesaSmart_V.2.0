// backend/src/controllers/admin/mesaController.js
// FIX: acepta tanto string como objeto en el body al crear
const Mesa = require("../../models/Mesa");

exports.getAll = async (req, res) => {
  try { res.json({ ok: true, mesas: await Mesa.findAll() }); }
  catch { res.status(500).json({ msg: "Error al obtener mesas." }); }
};

exports.create = async (req, res) => {
  try {
    // Soporta body como string "nombre" o como objeto { nombre, zona_id, ... }
    const nombre    = typeof req.body === "string" ? req.body : req.body?.nombre;
    const zona_id   = req.body?.zona_id   ?? null;
    const capacidad = req.body?.capacidad ?? 4;
    const pos_x     = req.body?.pos_x     ?? 0;
    const pos_y     = req.body?.pos_y     ?? 0;
    const forma     = req.body?.forma     ?? "cuadrada";

    if (!nombre?.trim())
      return res.status(400).json({ msg: "Nombre requerido." });

    const id = await Mesa.create({ nombre: nombre.trim(), zona_id, capacidad, pos_x, pos_y, forma });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[mesas/crear]", err);
    res.status(500).json({ msg: "Error al crear mesa." });
  }
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
  } catch { res.status(500).json({ msg: "Error al actualizar estado." }); }
};

exports.updatePosicion = async (req, res) => {
  try {
    const { pos_x, pos_y } = req.body;
    if (pos_x == null || pos_y == null)
      return res.status(400).json({ msg: "pos_x y pos_y son requeridos." });
    await Mesa.updatePosicion(req.params.id, pos_x, pos_y);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al guardar posición." }); }
};

exports.updatePosicionBatch = async (req, res) => {
  try {
    const { posiciones } = req.body;
    if (!Array.isArray(posiciones) || posiciones.length === 0)
      return res.status(400).json({ msg: "Posiciones requeridas." });
    await Mesa.updatePosicionBatch(posiciones);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al guardar posiciones." }); }
};

exports.updateConfig = async (req, res) => {
  try {
    const { zona_id, capacidad, forma, nombre } = req.body;
    await Mesa.updateConfig(req.params.id, { zona_id, capacidad, forma, nombre });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar mesa." }); }
};