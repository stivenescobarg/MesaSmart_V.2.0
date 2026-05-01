// backend/src/routes/admin/mesaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/mesaController");

r.get("/",                    auth, ctrl.getAll);
r.post("/",                   auth, role("admin"), ctrl.create);
r.delete("/:id",              auth, role("admin"), ctrl.remove);
r.patch("/:id/estado",        auth, ctrl.updateEstado);
r.patch("/:id/posicion",      auth, role("admin"), ctrl.updatePosicion);
r.patch("/:id/config",        auth, role("admin"), ctrl.updateConfig);
r.patch("/batch/posiciones",  auth, role("admin"), ctrl.updatePosicionBatch);

module.exports = r;