// backend/src/controllers/admin/metricaController.js
const Metrica    = require("../../models/Metrica");
const { Caja }   = require("../../models/Caja");

exports.getResumen = async (req, res) => {
  try {
    const caja = await Caja.getAbierta();
    if (!caja) return res.json({ ok: true, abierta: false, resumen: null });
    const resumen = await Metrica.getResumenDia(caja.id);
    res.json({ ok: true, abierta: true, caja_id: caja.id, resumen });
  } catch (err) {
    console.error("[métricas/resumen]", err);
    res.status(500).json({ msg: "Error al obtener métricas." });
  }
};

exports.getVentasPorDia = async (req, res) => {
  try {
    const datos = await Metrica.getVentasPorDia();
    res.json({ ok: true, datos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener ventas por día." });
  }
};

exports.getMetodosPago = async (req, res) => {
  try {
    const caja = await Caja.getAbierta();
    if (!caja) return res.json({ ok: true, datos: [] });
    const datos = await Metrica.getMetodosPago(caja.id);
    res.json({ ok: true, datos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener métodos de pago." });
  }
};