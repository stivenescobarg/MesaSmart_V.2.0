// backend/src/controllers/admin/facturaProveedorController.js
const FacturaProveedor = require("../../models/FacturaProveedor");
const Proveedor        = require("../../models/Proveedor");

exports.crear = async (req, res) => {
  try {
    const { numero, proveedor_id, fecha, fecha_venc, valor_total, observaciones } = req.body;

    if (!numero?.trim() || !proveedor_id || !fecha || !fecha_venc || !valor_total || valor_total <= 0)
      return res.status(400).json({ msg: "Número, proveedor, fechas y valor total son requeridos." });

    const proveedor = await Proveedor.getById(proveedor_id);
    if (!proveedor) return res.status(404).json({ msg: "Proveedor no encontrado." });

    const id = await FacturaProveedor.crear({
      numero: numero.trim(),
      proveedor_id,
      usuario_id: req.usuario.id,
      fecha,
      fecha_venc,
      valor_total: parseFloat(valor_total),
      observaciones,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[facturas-proveedor/crear]", err);
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ msg: `Ya existe una factura con el número "${req.body.numero}".` });
    res.status(500).json({ msg: "Error al registrar factura." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { proveedor_id, estado, fecha_desde, fecha_hasta, vencidas, proximas } = req.query;
    const facturas = await FacturaProveedor.getAll({
      proveedor_id,
      estado,
      fecha_desde,
      fecha_hasta,
      vencidas: vencidas === "true",
      proximas: proximas === "true",
    });
    res.json({ ok: true, facturas });
  } catch (err) {
    console.error("[facturas-proveedor/getAll]", err);
    res.status(500).json({ msg: "Error al obtener facturas." });
  }
};

exports.getById = async (req, res) => {
  try {
    const factura = await FacturaProveedor.getById(req.params.id);
    if (!factura) return res.status(404).json({ msg: "Factura no encontrada." });
    const pagos = await FacturaProveedor.getPagos(req.params.id);
    res.json({ ok: true, factura, pagos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener factura." });
  }
};

exports.registrarPago = async (req, res) => {
  try {
    const { monto, metodo_pago, observaciones, fecha } = req.body;
    if (!monto || monto <= 0)
      return res.status(400).json({ msg: "El monto del pago debe ser mayor a 0." });
    if (!["efectivo", "tarjeta", "transferencia"].includes(metodo_pago))
      return res.status(400).json({ msg: "Método de pago inválido." });

    const resultado = await FacturaProveedor.registrarPago({
      factura_id:   req.params.id,
      usuario_id:   req.usuario.id,
      monto:        parseFloat(monto),
      metodo_pago,
      observaciones,
      fecha: fecha || new Date().toISOString().split("T")[0],
    });

    res.json({ ok: true, ...resultado });
  } catch (err) {
    console.error("[facturas-proveedor/registrarPago]", err);
    res.status(400).json({ msg: err.message || "Error al registrar el pago." });
  }
};

exports.getIndicadores = async (req, res) => {
  try {
    const indicadores = await FacturaProveedor.getIndicadores();
    res.json({ ok: true, indicadores });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener indicadores." });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await FacturaProveedor.eliminar(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al eliminar factura." });
  }
};
