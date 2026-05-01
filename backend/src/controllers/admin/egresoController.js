// backend/src/controllers/admin/egresoController.js
const Egreso   = require("../../models/Egreso");
const { Caja } = require("../../models/Caja");

exports.crear = async (req, res) => {
  try {
    const { descripcion, monto } = req.body;
    if (!descripcion || !monto || monto <= 0)
      return res.status(400).json({ msg: "Descripción y monto válido son requeridos." });

    const caja = await Caja.getAbierta();
    if (!caja) return res.status(409).json({ msg: "No hay caja abierta." });

    const id = await Egreso.crear({
      caja_id:    caja.id,
      usuario_id: req.usuario.id,
      descripcion,
      monto:      parseFloat(monto),
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[egresos/crear]", err);
    res.status(500).json({ msg: "Error al registrar egreso." });
  }
};

exports.getByCajaActual = async (req, res) => {
  try {
    const caja = await Caja.getAbierta();
    if (!caja) return res.json({ ok: true, egresos: [] });
    const egresos = await Egreso.getByCaja(caja.id);
    res.json({ ok: true, egresos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener egresos." });
  }
};