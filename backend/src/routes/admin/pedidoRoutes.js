// backend/src/routes/admin/pedidoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/pedidoController");

r.post("/",                auth, ctrl.crear);
r.get("/mesa/:mesa_id",    auth, ctrl.getByMesa);
r.patch("/:id/estado",     auth, ctrl.updateEstado);
r.patch("/items/:item_id", auth, ctrl.updateItem);
module.exports = r;