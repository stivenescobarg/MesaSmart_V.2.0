// backend/src/controllers/admin/stockController.js
const Stock = require("../../models/Stock");

// PIN de stock — en producción usar process.env.STOCK_PIN
const STOCK_PIN = process.env.STOCK_PIN || "1234";

// ── ADMIN ─────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const productos = await Stock.findAll();
    const resumen   = await Stock.getResumen();
    res.json({ ok: true, productos, resumen });
  } catch (err) {
    console.error("[stock/getAll]", err);
    res.status(500).json({ msg: "Error al obtener inventario." });
  }
};

exports.getBajoStock = async (req, res) => {
  try {
    res.json({ ok: true, productos: await Stock.findBajoStock() });
  } catch {
    res.status(500).json({ msg: "Error al obtener alertas de stock." });
  }
};

exports.getResumen = async (req, res) => {
  try {
    res.json({ ok: true, resumen: await Stock.getResumen() });
  } catch {
    res.status(500).json({ msg: "Error al obtener resumen." });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima } = req.body;
    if (!nombre?.trim() || !proveedor?.trim() || !categoria)
      return res.status(400).json({ msg: "Nombre, proveedor y categoría son requeridos." });
    const id = await Stock.create({
      nombre: nombre.trim(), proveedor: proveedor.trim(),
      categoria, unidad: unidad || "unidad",
      cantidad_actual: parseFloat(cantidad_actual) || 0,
      cantidad_minima: parseFloat(cantidad_minima) || 5,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[stock/create]", err);
    res.status(500).json({ msg: "Error al crear producto." });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, proveedor, categoria, unidad, cantidad_minima } = req.body;
    await Stock.update(req.params.id, { nombre, proveedor, categoria, unidad, cantidad_minima });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ msg: "Error al actualizar producto." });
  }
};

exports.remove = async (req, res) => {
  try {
    await Stock.delete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ msg: "Error al eliminar producto." });
  }
};

exports.registrarMovimiento = async (req, res) => {
  try {
    const { producto_id, tipo, cantidad, observacion, fecha } = req.body;
    if (!producto_id || !tipo || !cantidad)
      return res.status(400).json({ msg: "producto_id, tipo y cantidad son requeridos." });
    if (!["ingreso", "egreso", "ajuste"].includes(tipo))
      return res.status(400).json({ msg: "Tipo inválido." });
    const id = await Stock.registrarMovimiento({
      producto_id, usuario_id: req.usuario.id,
      tipo, cantidad: parseFloat(cantidad), observacion, fecha,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[stock/movimiento]", err);
    res.status(500).json({ msg: "Error al registrar movimiento." });
  }
};

exports.getMovimientos = async (req, res) => {
  try {
    const movs = await Stock.getMovimientos(req.params.id);
    res.json({ ok: true, movimientos: movs });
  } catch {
    res.status(500).json({ msg: "Error al obtener movimientos." });
  }
};

// ── COCINA (sin auth de admin, con PIN) ───────────────────────────

// Validar PIN
exports.validarPin = (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ ok: false, msg: "PIN requerido." });
  if (String(pin) === String(STOCK_PIN)) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, msg: "PIN incorrecto." });
};

// Solo productos de cocina
exports.getCocina = async (req, res) => {
  try {
    const todos = await Stock.findAll();
    const cocina = todos.filter(p => p.categoria === "cocina");
    res.json({ ok: true, productos: cocina });
  } catch {
    res.status(500).json({ msg: "Error al obtener stock de cocina." });
  }
};

// Registrar movimiento desde panel cocina (usa usuario_id fijo = 1 sistema)
exports.registrarMovCocina = async (req, res) => {
  try {
    const { pin, producto_id, tipo, cantidad, observacion } = req.body;

    // Validar PIN
    if (String(pin) !== String(STOCK_PIN))
      return res.status(401).json({ ok: false, msg: "PIN incorrecto." });

    if (!producto_id || !tipo || !cantidad)
      return res.status(400).json({ msg: "Datos incompletos." });

    const id = await Stock.registrarMovimiento({
      producto_id,
      usuario_id: null, // usuario sistema cuando viene de cocina
      tipo,
      cantidad: parseFloat(cantidad),
      observacion: observacion || "Desde panel cocina",
      fecha: new Date().toISOString().split("T")[0],
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[stock/cocina/movimiento]", err);
    res.status(500).json({ msg: "Error al registrar movimiento." });
  }
};