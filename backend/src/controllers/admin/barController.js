// backend/src/controllers/admin/barController.js
const { pool } = require("../../config/db");
const OrdenBar = require("../../models/OrdenBar");
const barOrderService = require("../../services/barOrderService");
const barInventoryService = require("../../services/barInventoryService");

const itemsValidos = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every(
    (item) =>
      item &&
      typeof item.nombre === "string" &&
      item.nombre.trim() &&
      Number.isFinite(Number(item.cantidad)) &&
      Number(item.cantidad) > 0
  );

exports.crear = async (req, res) => {
  try {
    const { mesa, items, observacion, restaurante_id } = req.body;

    if (!restaurante_id || !Number.isFinite(Number(restaurante_id)))
      return res.status(400).json({ msg: "El restaurante es requerido." });
    if (!mesa?.trim())
      return res.status(400).json({ msg: "La mesa es requerida." });
    if (!itemsValidos(items))
      return res
        .status(400)
        .json({ msg: "Incluye al menos una bebida válida." });

    const resultado = await barOrderService.crear({
      restaurante_id: Number(restaurante_id),
      mesa: mesa.trim(),
      items: items.map((item) => ({
        nombre: item.nombre.trim(),
        cantidad: Number(item.cantidad),
        imgKey: item.imgKey || null,
        adiciones: Array.isArray(item.adiciones) ? item.adiciones : [],
        opcion: item.opcion || null,
      })),
      observacion: observacion || null,
      usuario_id: req.usuario?.id || null,
      ip_address: req.ip || req.connection.remoteAddress || null,
    });

    if (!resultado.ok) {
      return res.status(400).json({ msg: resultado.error });
    }

    res
      .status(201)
      .json({ ok: true, id: resultado.id, mensaje: resultado.mensaje });
  } catch (err) {
    console.error("[bar/crear]", err);
    res.status(500).json({ msg: "No fue posible registrar la orden del bar." });
  }
};

exports.activas = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const ordenes = await OrdenBar.activas(restaurante_id);
    res.json({ ok: true, ordenes });
  } catch (err) {
    console.error("[bar/activas]", err);
    res.status(500).json({ msg: "No fue posible obtener las órdenes." });
  }
};

exports.historialHoy = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const ordenes = await OrdenBar.historialHoy(restaurante_id);
    res.json({ ok: true, ordenes });
  } catch (err) {
    console.error("[bar/historialHoy]", err);
    res.status(500).json({ msg: "No fue posible obtener el historial." });
  }
};

exports.resumen = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const [resumen, inventario] = await Promise.all([
      OrdenBar.resumenHoy(restaurante_id),
      barInventoryService.obtenerInventario(restaurante_id),
    ]);
    const alertas_stock = inventario.filter((item) => item.bajo_stock);
    res.json({ ok: true, resumen, alertas_stock });
  } catch (err) {
    console.error("[bar/resumen]", err);
    res.status(500).json({ msg: "No fue posible obtener el resumen del bar." });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const resultado = await barOrderService.actualizarEstado(
      req.params.id,
      restaurante_id,
      req.body.estado,
      req.usuario?.id || null,
      req.ip || req.connection.remoteAddress || null
    );

    if (!resultado.ok) {
      return res.status(resultado.status || 400).json({ msg: resultado.error });
    }

    res.json({
      ok: true,
      orden: { id: resultado.id, estado: resultado.estado },
    });
  } catch (err) {
    console.error("[bar/actualizarEstado]", err);
    res.status(500).json({ msg: "No fue posible actualizar la orden." });
  }
};

exports.inventario = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const productos = await barInventoryService.obtenerInventario(restaurante_id);
    res.json({ ok: true, productos });
  } catch (err) {
    console.error("[bar/inventario]", err);
    res.status(500).json({ msg: "No fue posible obtener el inventario del bar." });
  }
};

exports.registrarConsumo = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const { producto_id, cantidad, observacion } = req.body;
    const cantidadNumerica = Number(cantidad);

    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      return res
        .status(400)
        .json({ msg: "La cantidad debe ser mayor que cero." });
    }

    const producto = await barInventoryService.obtenerProducto(restaurante_id, producto_id);
    if (!producto) {
      return res.status(404).json({ msg: "Producto de bar no encontrado." });
    }

    const resultado = await barInventoryService.reducirInventario(
      restaurante_id,
      producto_id,
      cantidadNumerica,
      "consumo_manual",
      req.usuario?.id || null,
      req.ip || req.connection.remoteAddress || null
    );

    if (!resultado.ok) {
      return res.status(400).json({ msg: resultado.error });
    }

    res.status(201).json({
      ok: true,
      id: producto_id,
      mensaje: resultado.mensaje,
      cantidad_actual: resultado.cantidad_actual,
    });
  } catch (err) {
    console.error("[bar/consumo]", err);
    res.status(500).json({ msg: "No fue posible registrar el consumo." });
  }
};

// Actividad de órdenes creadas en la última hora, agrupada en intervalos de 5 minutos.
// Pensado para BarActivityChart.jsx.
exports.actividad = async (req, res) => {
  try {
    const restaurante_id = req.usuario?.restaurante_id;
    if (!restaurante_id)
      return res.status(400).json({ msg: "Usuario sin restaurante asignado." });

    const INTERVALO_MINUTOS = 5;
    const TOTAL_INTERVALOS = 12; // última hora

    const buckets = await OrdenBar.actividadReciente(
      restaurante_id,
      INTERVALO_MINUTOS * TOTAL_INTERVALOS,
      INTERVALO_MINUTOS
    );
    const cantidadPorBucket = new Map(
      buckets.map((b) => [Number(b.bucket), Number(b.cantidad)])
    );

    const ahora = new Date();
    const actividad = [];
    for (let i = TOTAL_INTERVALOS - 1; i >= 0; i--) {
      const tiempo = new Date(ahora.getTime() - i * INTERVALO_MINUTOS * 60000);
      actividad.push({
        tiempo: tiempo.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        ordenes: cantidadPorBucket.get(i) || 0,
      });
    }

    res.json({ ok: true, actividad });
  } catch (err) {
    console.error("[bar/actividad]", err);
    res.status(500).json({ msg: "No fue posible obtener la actividad del bar." });
  }
};