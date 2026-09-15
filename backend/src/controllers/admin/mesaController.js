const Mesa = require("../../models/Mesa");
const { generarQRBase64, generarQRBuffer } = require("../../services/qrService");

exports.getAll = async (req, res) => {
  try { res.json({ ok: true, mesas: await Mesa.findAll(req.restaurante_id) }); }
  catch { res.status(500).json({ msg: "Error al obtener mesas." }); }
};

exports.create = async (req, res) => {
  try {
    const nombre    = typeof req.body === "string" ? req.body : req.body?.nombre;
    const zona_id   = req.body?.zona_id   ?? null;
    const capacidad = req.body?.capacidad ?? 4;
    const pos_x     = req.body?.pos_x     ?? 0;
    const pos_y     = req.body?.pos_y     ?? 0;
    const forma     = req.body?.forma     ?? "cuadrada";

    if (!nombre?.trim())
      return res.status(400).json({ msg: "Nombre requerido." });

    const id = await Mesa.create({
      restaurante_id: req.restaurante_id,
      nombre: nombre.trim(), zona_id, capacidad, pos_x, pos_y, forma,
    });

    // ── QR automático ──
    // En cuanto la mesa existe, su QR ya es válido (la URL solo necesita
    // restaurante_id + mesa_id, ambos ya definidos). Lo generamos aquí mismo
    // y lo devolvemos junto con la respuesta, así el admin lo ve/descarga
    // sin tener que hacer una segunda llamada.
    const qr = await generarQRBase64(req.restaurante_id, id);

    res.status(201).json({ ok: true, id, qr });
  } catch (err) {
    console.error("[mesas/crear]", err);
    res.status(500).json({ msg: "Error al crear mesa." });
  }
};

exports.remove = async (req, res) => {
  try {
    const m = await Mesa.findById(req.params.id, req.restaurante_id);
    if (!m) return res.status(404).json({ msg: "Mesa no encontrada." });
    if (m.ocupada) return res.status(409).json({ msg: "Mesa tiene pedidos activos." });
    await Mesa.delete(req.params.id, req.restaurante_id);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al eliminar mesa." }); }
};

exports.updateEstado = async (req, res) => {
  try {
    const ok = await Mesa.updateEstado(req.params.id, req.restaurante_id, req.body.estado);
    if (!ok) return res.status(404).json({ msg: "Mesa no encontrada." });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar estado." }); }
};

exports.updatePosicion = async (req, res) => {
  try {
    const { pos_x, pos_y } = req.body;
    if (pos_x == null || pos_y == null)
      return res.status(400).json({ msg: "pos_x y pos_y son requeridos." });
    const ok = await Mesa.updatePosicion(req.params.id, req.restaurante_id, pos_x, pos_y);
    if (!ok) return res.status(404).json({ msg: "Mesa no encontrada." });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al guardar posición." }); }
};

exports.updatePosicionBatch = async (req, res) => {
  try {
    const { posiciones } = req.body;
    if (!Array.isArray(posiciones) || posiciones.length === 0)
      return res.status(400).json({ msg: "Posiciones requeridas." });
    await Mesa.updatePosicionBatch(req.restaurante_id, posiciones);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al guardar posiciones." }); }
};

exports.updateConfig = async (req, res) => {
  try {
    const { zona_id, capacidad, forma, nombre } = req.body;
    const ok = await Mesa.updateConfig(req.params.id, req.restaurante_id, { zona_id, capacidad, forma, nombre });
    if (!ok) return res.status(404).json({ msg: "Mesa no encontrada." });
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar mesa." }); }
};

// ── NUEVO: descargar/ver el QR de una mesa ya existente ──
// Útil para reimprimir un QR perdido/dañado sin tener que recrear la mesa.
exports.getQR = async (req, res) => {
  try {
    const m = await Mesa.findById(req.params.id, req.restaurante_id);
    if (!m) return res.status(404).json({ msg: "Mesa no encontrada." });

    const { buffer } = await generarQRBuffer(req.restaurante_id, req.params.id);
    res.set("Content-Type", "image/png");
    res.set("Content-Disposition", `inline; filename="mesa-${m.nombre}-qr.png"`);
    res.send(buffer);
  } catch (err) {
    console.error("[mesas/qr]", err);
    res.status(500).json({ msg: "Error al generar el QR." });
  }
};