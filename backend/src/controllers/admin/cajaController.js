const { Caja, Venta } = require("../../models/Caja");
const Egreso          = require("../../models/Egreso");
const Mesa            = require("../../models/Mesa");
const generarPDF      = require("../../utils/generarPDF");

exports.getEstado = async (req, res) => {
  try {
    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.json({ ok: true, abierta: false, caja: null });
    const ventas = await Caja.getVentas(caja.id);
    res.json({ ok: true, abierta: true, caja: { ...caja, ventas } });
  } catch { res.status(500).json({ msg: "Error al obtener caja." }); }
};

exports.abrir = async (req, res) => {
  try {
    if (await Caja.getAbierta(req.restaurante_id))
      return res.status(409).json({ msg: "Ya hay una caja abierta." });
    const { monto_inicial } = req.body;
    if (monto_inicial == null)
      return res.status(400).json({ msg: "Monto inicial requerido." });
    const id = await Caja.abrir(req.usuario.id, monto_inicial, req.restaurante_id);
    res.status(201).json({ ok: true, id });
  } catch { res.status(500).json({ msg: "Error al abrir caja." }); }
};

exports.cerrar = async (req, res) => {
  try {
    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.status(404).json({ msg: "No hay caja abierta." });

    const datosPDF = await Caja.getDatosParaPDF(caja.id, req.restaurante_id);
    const egresos  = await Egreso.getByCaja(caja.id);

    const resultado = await Caja.cerrar(caja.id, req.usuario.id, req.restaurante_id);

    let pdfBase64 = null;
    try {
      pdfBase64 = await generarPDF({
        caja:      { ...datosPDF.caja, ...resultado },
        ventas:    datosPDF.ventas,
        egresos,
        cerradoPor: req.usuario,
      });
    } catch (pdfErr) {
      console.error("[PDF] Error al generar:", pdfErr.message);
    }

    res.json({ ok: true, ...resultado, pdf: pdfBase64 });
  } catch (err) {
    console.error("[cerrar caja]", err);
    res.status(err.status || 500).json({ msg: err.status ? err.message : "Error al cerrar caja." });
  }
};

exports.getHistorial = async (req, res) => {
  try { res.json({ ok: true, historial: await Caja.getHistorial(req.restaurante_id) }); }
  catch { res.status(500).json({ msg: "Error al obtener historial." }); }
};

exports.registrarPago = async (req, res) => {
  try {
    const { mesa_id, mesa_nombre, pedido_id, total, metodo_pago, items } = req.body;
    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.status(409).json({ msg: "No hay caja abierta." });

    const venta_id = await Venta.registrar({
      caja_id: caja.id, pedido_id: pedido_id||null,
      mesa_nombre, total, metodo_pago,
      usuario_id: req.usuario.id, items,
    });

    const { pool } = require("../../config/db");
    const [activos] = await pool.execute(
      "SELECT COUNT(*) as n FROM pedidos WHERE mesa_id=? AND estado NOT IN ('pagado','cancelado')",
      [mesa_id]
    );
    if ((activos[0]?.n || 0) == 0) await Mesa.updateEstado(mesa_id, "libre");

    res.status(201).json({ ok: true, venta_id });
  } catch (err) {
    console.error("[pago]", err);
    res.status(500).json({ msg: "Error al registrar pago." });
  }
};