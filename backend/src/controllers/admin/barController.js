const OrdenBar = require("../../models/OrdenBar");
const Stock = require("../../models/Stock");

const itemsValidos = (items) => Array.isArray(items) && items.length > 0 && items.every(item =>
  item && typeof item.nombre === "string" && item.nombre.trim() &&
  Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) > 0
);

exports.crear = async (req, res) => {
  try {
    const { mesa, items, observacion } = req.body;
    if (!mesa?.trim()) return res.status(400).json({ msg: "La mesa es requerida." });
    if (!itemsValidos(items)) return res.status(400).json({ msg: "Incluye al menos una bebida válida." });

    const ordenId = await OrdenBar.crear({
      mesa,
      observacion,
      items: items.map(item => ({
        nombre: item.nombre.trim(),
        cantidad: Number(item.cantidad),
        imgKey: item.imgKey || null,
        adiciones: Array.isArray(item.adiciones) ? item.adiciones : [],
        opcion: item.opcion || null,
      })),
    });
    res.status(201).json({ ok: true, id: ordenId });
  } catch (err) {
    console.error("[bar/crear]", err);
    res.status(500).json({ msg: "No fue posible registrar la orden del bar." });
  }
};

exports.activas = async (_req, res) => {
  try { res.json({ ok: true, ordenes: await OrdenBar.activas() }); }
  catch (err) {
    console.error("[bar/activas]", err);
    res.status(500).json({ msg: "No fue posible obtener las órdenes." });
  }
};

exports.historialHoy = async (_req, res) => {
  try { res.json({ ok: true, ordenes: await OrdenBar.historialHoy() }); }
  catch { res.status(500).json({ msg: "No fue posible obtener el historial." }); }
};

exports.resumen = async (_req, res) => {
  try {
    const [resumen, inventario] = await Promise.all([OrdenBar.resumenHoy(), Stock.findAll()]);
    const alertas_stock = inventario.filter(item => item.categoria === "bar" && item.bajo_stock);
    res.json({ ok: true, resumen, alertas_stock });
  } catch (err) {
    console.error("[bar/resumen]", err);
    res.status(500).json({ msg: "No fue posible obtener el resumen del bar." });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const resultado = await OrdenBar.actualizarEstado(req.params.id, req.body.estado, req.usuario.id);
    if (resultado.error) return res.status(resultado.status || 400).json({ msg: resultado.error });
    res.json({ ok: true, orden: resultado });
  } catch (err) {
    console.error("[bar/actualizarEstado]", err);
    res.status(500).json({ msg: "No fue posible actualizar la orden." });
  }
};

exports.inventario = async (_req, res) => {
  try {
    const productos = (await Stock.findAll()).filter(producto => producto.categoria === "bar");
    res.json({ ok: true, productos });
  } catch (err) {
    console.error("[bar/inventario]", err);
    res.status(500).json({ msg: "No fue posible obtener el inventario del bar." });
  }
};

exports.registrarConsumo = async (req, res) => {
  try {
    const { producto_id, cantidad, observacion } = req.body;
    const cantidadNumerica = Number(cantidad);
    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      return res.status(400).json({ msg: "La cantidad debe ser mayor que cero." });
    }
    const producto = (await Stock.findAll()).find(item =>
      Number(item.id) === Number(producto_id) && item.categoria === "bar"
    );
    if (!producto) return res.status(404).json({ msg: "Producto de bar no encontrado." });

    const id = await Stock.registrarMovimiento({
      producto_id: producto.id,
      usuario_id: req.usuario.id,
      tipo: "egreso",
      cantidad: cantidadNumerica,
      observacion: observacion?.trim() || "Consumo registrado desde el panel de bar",
      fecha: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[bar/consumo]", err);
    res.status(500).json({ msg: "No fue posible registrar el consumo." });
  }
};
