// backend/src/controllers/admin/pedidoController.js
const Pedido      = require("../../models/Pedido");
const { Caja }    = require("../../models/Caja");

exports.crear = async (req, res) => {
  try {
    const { mesa_id, items, observacion } = req.body;
    if (!mesa_id || !items?.length)
      return res.status(400).json({ msg: "Mesa e items requeridos." });
    const caja = await Caja.getAbierta();
    const id   = await Pedido.create({ mesa_id, caja_id: caja?.id || null, items, observacion });
    res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("[pedidos/crear]", err);
    res.status(500).json({ msg: "Error al crear pedido." });
  }
};
exports.getByMesa = async (req, res) => {
  try { res.json({ ok: true, pedido: await Pedido.findByMesa(req.params.mesa_id) }); }
  catch { res.status(500).json({ msg: "Error al obtener pedido." }); }
};
exports.updateEstado = async (req, res) => {
  try {
    await Pedido.updateEstado(req.params.id, req.body.estado);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al actualizar estado." }); }
};
exports.updateItem = async (req, res) => {
  try {
    await Pedido.updateItem(req.params.item_id, req.body.cantidad);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al modificar item." }); }
};