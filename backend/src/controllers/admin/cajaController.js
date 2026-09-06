const { Caja, Venta } = require("../../models/Caja");
const Egreso          = require("../../models/Egreso");
const Mesa            = require("../../models/Mesa");
const generarPDF      = require("../../utils/generarPDF");
const { tieneFeature } = require("../../middlewares/requierePlan");

const METODOS_VALIDOS = ["efectivo", "tarjeta", "transferencia"];

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

    // El reporte PDF automático es exclusivo del Plan Completo (ver planes.js).
    // Cerrar caja en sí es una función Básica, así que NO bloqueamos la ruta
    // con requierePlan — solo omitimos el PDF si el restaurante no califica.
    let pdfBase64 = null;
    const puedeGenerarPDF = await tieneFeature(req.restaurante_id, "reporte_pdf_diario");

    if (puedeGenerarPDF) {
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

// GET /api/caja/venta/:id — detalle completo para poder ver/editar
exports.getVentaDetalle = async (req, res) => {
  try {
    const venta = await Venta.getDetalle(req.params.id, req.restaurante_id);
    if (!venta) return res.status(404).json({ msg: "Venta no encontrada." });
    res.json({ ok: true, venta });
  } catch { res.status(500).json({ msg: "Error al obtener la venta." }); }
};

// PUT /api/caja/venta/:id — corrige una venta (requiere PIN + motivo)
// controllers/admin/cajaController.js
exports.editarVenta = async (req, res) => {
  try {
    const { pin, motivo, items, pagos, descuento, servicio, propina } = req.body;

    if (!pin || pin !== process.env.PIN_EDITAR_VENTA) {
      return res.status(403).json({ msg: "PIN incorrecto." });
    }

    const resultado = await Venta.editar({
      venta_id: req.params.id,
      restaurante_id: req.restaurante_id,
      usuario_id: req.usuario.id,
      motivo, items, pagos, descuento, servicio, propina,
    });

    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.status ? err.message : "Error al editar la venta." });
  }
};

exports.registrarPago = async (req, res) => {
  try {
    const {
      mesa_id, mesa_nombre, pedido_id, total, metodo_pago, items,
      // Desglose que viene del `resumen` calculado en el frontend
      // (DetalleMesa.jsx → calcularResumenCuenta). Todos opcionales y con
      // default 0 para no romper llamadas viejas que no los envíen todavía.
      consumo   = null,
      descuento = 0,
      servicio  = 0,
      propina   = 0,
      // Si el pago corresponde a una subcuenta, se guarda su nombre
      // para poder identificarla en el historial/PDF. Es opcional.
      subcuenta_nombre = null,
      // ── NUEVO: pago mixto — [{ metodo_pago: 'efectivo', monto: 40000 }, ...]
      // Si no viene, se registra como pago de un solo método (metodo_pago + total),
      // igual que antes.
      pagos = null,
    } = req.body;

    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.status(409).json({ msg: "No hay caja abierta." });

    // Validaciones mínimas de servidor (no confiar solo en el frontend)
    if (descuento < 0 || servicio < 0 || propina < 0) {
      return res.status(400).json({ msg: "Descuento, servicio y propina no pueden ser negativos." });
    }

    if (pagos) {
      if (!Array.isArray(pagos) || !pagos.length) {
        return res.status(400).json({ msg: "El desglose de pagos es inválido." });
      }
      for (const p of pagos) {
        const metodoNormalizado = String(p.metodo_pago || "").toLowerCase();
        if (!METODOS_VALIDOS.includes(metodoNormalizado) || !(parseFloat(p.monto) > 0)) {
          return res.status(400).json({ msg: "Cada método de pago debe ser válido y tener un monto mayor a 0." });
        }
      }
      const suma = pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0);
      if (Math.abs(suma - parseFloat(total)) > 1) {
        return res.status(400).json({ msg: "La suma de los métodos de pago no coincide con el total de la cuenta." });
      }
    }

    const venta_id = await Venta.registrar({
      caja_id: caja.id, pedido_id: pedido_id || null,
      mesa_nombre, total, metodo_pago, usuario_id: req.usuario.id, items,
      consumo: consumo ?? total, descuento, servicio, propina,
      subcuenta_nombre,
      // Normalizamos cada método a minúscula (el ENUM en BD es minúscula;
      // el frontend hoy trabaja con "Efectivo", "Tarjeta", "Transferencia").
      pagos: pagos
        ? pagos.map(p => ({ metodo_pago: String(p.metodo_pago).toLowerCase(), monto: parseFloat(p.monto) }))
        : null,
      restaurante_id: req.restaurante_id,
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
    res.status(err.status || 500).json({ msg: err.status ? err.message : "Error al registrar pago." });
  }
};