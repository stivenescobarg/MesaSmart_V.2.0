// backend/src/controllers/admin/egresoController.js
const Egreso   = require("../../models/Egreso");
const { Caja } = require("../../models/Caja");

const CATEGORIAS_VALIDAS = [
  "Compra de carne", "Compra de verduras", "Compra de bebidas", "Gas", "Agua",
  "Internet", "Luz", "Arriendo", "Nómina", "Mantenimiento", "Papelería",
  "Transporte", "Publicidad", "Domicilios", "Otros",
];

const resolverRangoFecha = ({ periodo, fecha_desde, fecha_hasta }) => {
  if (periodo && periodo !== "personalizado") {
    const hoy = new Date();
    const desde = new Date(hoy);
    if (periodo === "hoy") { /* desde = hoy mismo */ }
    if (periodo === "semana") desde.setDate(hoy.getDate() - 7);
    if (periodo === "mes")    desde.setMonth(hoy.getMonth() - 1);
    if (periodo === "anio")   desde.setFullYear(hoy.getFullYear() - 1);
    return {
      fecha_desde: desde.toISOString().split("T")[0],
      fecha_hasta: hoy.toISOString().split("T")[0],
    };
  }
  return { fecha_desde, fecha_hasta };
};

exports.crear = async (req, res) => {
  try {
    const { descripcion, monto, categoria } = req.body;
    if (!descripcion || !monto || monto <= 0)
      return res.status(400).json({ msg: "Descripción y monto válido son requeridos." });

    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.status(409).json({ msg: "No hay caja abierta." });

    const id = await Egreso.crear({
      caja_id:        caja.id,
      restaurante_id: req.restaurante_id,
      usuario_id:     req.usuario.id,
      descripcion,
      categoria: categoria || "Otros",
      monto:     parseFloat(monto),
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[egresos/crear]", err);
    res.status(500).json({ msg: "Error al registrar egreso." });
  }
};

exports.getByCajaActual = async (req, res) => {
  try {
    const caja = await Caja.getAbierta(req.restaurante_id);
    if (!caja) return res.json({ ok: true, egresos: [] });
    const egresos = await Egreso.getByCaja(caja.id);
    res.json({ ok: true, egresos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener egresos." });
  }
};

exports.getHistorial = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta, categoria } = req.query;
    const rango = resolverRangoFecha({ periodo, fecha_desde, fecha_hasta });
    const egresos = await Egreso.getByRangoFecha({ ...rango, categoria, restaurante_id: req.restaurante_id });
    res.json({ ok: true, egresos, categorias: CATEGORIAS_VALIDAS });
  } catch (err) {
    console.error("[egresos/getHistorial]", err);
    res.status(500).json({ msg: "Error al obtener el historial de gastos." });
  }
};

exports.getGraficos = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta } = req.query;
    const rango = resolverRangoFecha({ periodo, fecha_desde, fecha_hasta });

    const [porCategoria, porDia] = await Promise.all([
      Egreso.getTotalPorCategoria({ ...rango, restaurante_id: req.restaurante_id }),
      Egreso.getTotalPorDia({ ...rango, restaurante_id: req.restaurante_id }),
    ]);

    res.json({ ok: true, porCategoria, porDia });
  } catch (err) {
    console.error("[egresos/getGraficos]", err);
    res.status(500).json({ msg: "Error al obtener datos para gráficos." });
  }
};

exports.getCategorias = (_req, res) => {
  res.json({ ok: true, categorias: CATEGORIAS_VALIDAS });
};