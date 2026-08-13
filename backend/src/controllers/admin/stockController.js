const Stock = require("../../models/Stock");

const STOCK_PIN = process.env.STOCK_PIN || "1234";

// ── ADMIN (protegidas, usan req.restaurante_id del JWT) ───────────

exports.getAll = async (req, res) => {
  try {
    const productos = await Stock.findAll(req.restaurante_id);
    const resumen   = await Stock.getResumen(req.restaurante_id);
    res.json({ ok: true, productos, resumen });
  } catch (err) {
    console.error("[stock/getAll]", err);
    res.status(500).json({ msg: "Error al obtener inventario." });
  }
};

exports.getBajoStock = async (req, res) => {
  try {
    res.json({ ok: true, productos: await Stock.findBajoStock(req.restaurante_id) });
  } catch {
    res.status(500).json({ msg: "Error al obtener alertas de stock." });
  }
};

exports.getResumen = async (req, res) => {
  try {
    res.json({ ok: true, resumen: await Stock.getResumen(req.restaurante_id) });
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
      restaurante_id: req.restaurante_id,
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
    const ok = await Stock.update(req.params.id, req.restaurante_id, { nombre, proveedor, categoria, unidad, cantidad_minima });
    if (!ok) return res.status(404).json({ msg: "Producto no encontrado." });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ msg: "Error al actualizar producto." });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await Stock.delete(req.params.id, req.restaurante_id);
    if (!ok) return res.status(404).json({ msg: "Producto no encontrado." });
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
      producto_id, restaurante_id: req.restaurante_id, usuario_id: req.usuario.id,
      tipo, cantidad: parseFloat(cantidad), observacion, fecha,
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[stock/movimiento]", err);
    res.status(err.status || 500).json({ msg: err.status ? err.message : "Error al registrar movimiento." });
  }
};

exports.getMovimientos = async (req, res) => {
  try {
    const movs = await Stock.getMovimientos(req.params.id, req.restaurante_id);
    res.json({ ok: true, movimientos: movs });
  } catch {
    res.status(500).json({ msg: "Error al obtener movimientos." });
  }
};

// ── COCINA (sin auth de admin — publicTenant + PIN) ───────────────
// req.restaurante_id ya viene resuelto por publicTenant (slug o fallback),
// el PIN es una capa adicional de fricción, no reemplaza el aislamiento.

exports.validarPin = (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ ok: false, msg: "PIN requerido." });
  if (String(pin) === String(STOCK_PIN)) return res.json({ ok: true });
  return res.status(401).json({ ok: false, msg: "PIN incorrecto." });
};

exports.getCocina = async (req, res) => {
  try {
    const todos = await Stock.findAll(req.restaurante_id);
    const cocina = todos.filter(p => p.categoria === "cocina");
    res.json({ ok: true, productos: cocina });
  } catch {
    res.status(500).json({ msg: "Error al obtener stock de cocina." });
  }
};

exports.registrarMovCocina = async (req, res) => {
  try {
    const { pin, producto_id, tipo, cantidad, observacion } = req.body;

    if (String(pin) !== String(STOCK_PIN))
      return res.status(401).json({ ok: false, msg: "PIN incorrecto." });

    if (!producto_id || !tipo || !cantidad)
      return res.status(400).json({ msg: "Datos incompletos." });

    const id = await Stock.registrarMovimiento({
      producto_id,
      restaurante_id: req.restaurante_id,
      usuario_id: null,
      tipo,
      cantidad: parseFloat(cantidad),
      observacion: observacion || "Desde panel cocina",
      fecha: new Date().toISOString().split("T")[0],
    });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[stock/cocina/movimiento]", err);
    res.status(err.status || 500).json({ msg: err.status ? err.message : "Error al registrar movimiento." });
  }
};

exports.getCatalogoCocina = async (req, res) => {
  try {
    const ingredientes = await Stock.getIngredientes(req.restaurante_id);
    res.json({ ok: true, productos: ingredientes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: "Error al obtener ingredientes." });
  }
};

exports.activarProductoCocina = async (req, res) => {
  try {
    const { pin, producto_id, cantidad_minima } = req.body;

    if (String(pin) !== String(STOCK_PIN))
      return res.status(401).json({ ok: false, msg: "PIN incorrecto." });
    if (!producto_id)
      return res.status(400).json({ ok: false, msg: "producto_id requerido." });

    const ok = await Stock.activarCocina(producto_id, req.restaurante_id, cantidad_minima ? parseFloat(cantidad_minima) : null);
    if (!ok) return res.status(404).json({ ok: false, msg: "Producto no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error("[stock/cocina/activar]", err);
    res.status(500).json({ ok: false, msg: "Error al activar ingrediente." });
  }
};

exports.desactivarProductoCocina = async (req, res) => {
  try {
    const { pin, producto_id } = req.body;

    if (String(pin) !== String(STOCK_PIN))
      return res.status(401).json({ ok: false, msg: "PIN incorrecto." });
    if (!producto_id)
      return res.status(400).json({ ok: false, msg: "producto_id requerido." });

    const ok = await Stock.desactivarCocina(producto_id, req.restaurante_id);
    if (!ok) return res.status(404).json({ ok: false, msg: "Producto no encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error("[stock/cocina/desactivar]", err);
    res.status(500).json({ ok: false, msg: "Error al quitar ingrediente de cocina." });
  }
};