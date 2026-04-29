// backend/src/routes/admin/pedidoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/pedidoController");

// ── Rutas generales ──────────────────────────────────────────────
r.get("/",             auth, ctrl.getPedidos);
r.post("/",            auth, ctrl.createPedido);
r.patch("/:id/estado", auth, ctrl.updateEstadoPedido);
r.get("/estados",      auth, ctrl.getEstados);
r.get("/categorias",   auth, ctrl.getCategorias);
r.get("/cocinero",     auth, ctrl.getCocineroTurno);

// ── Rutas de items ───────────────────────────────────────────────
// ⚠️ IMPORTANTE: /items/mover debe ir ANTES de /items/:item_id
// porque Express igualaría "mover" como un item_id si va después.
r.patch("/items/mover",      auth, ctrl.moverItems);   // mover items a otra mesa
r.patch("/items/:item_id",   auth, ctrl.updateItem);   // modificar cantidad
r.delete("/items/:item_id",  auth, ctrl.deleteItem);   // eliminar item (con PIN en front)

module.exports = r;