// backend/src/routes/admin/pedidoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/pedidoController");

r.get("/",              auth, ctrl.getPedidos);
r.post("/",             auth, ctrl.createPedido);
r.patch("/:id/estado",  auth, ctrl.updateEstadoPedido);
r.get("/estados",       auth, ctrl.getEstados);
r.get("/categorias",    auth, ctrl.getCategorias);
r.get("/cocinero",      auth, ctrl.getCocineroTurno);

module.exports = r;