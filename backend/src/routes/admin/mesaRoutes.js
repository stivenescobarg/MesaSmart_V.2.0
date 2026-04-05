// backend/src/routes/admin/mesaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/mesaController");

r.get("/",             auth, ctrl.getAll);
r.post("/",            auth, role("admin"), ctrl.create);
r.delete("/:id",       auth, role("admin"), ctrl.remove);
r.patch("/:id/estado", auth, ctrl.updateEstado);
module.exports = r;