// backend/src/routes/admin/cajaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/cajaController");

r.get("/estado",    auth, ctrl.getEstado);
r.post("/abrir",    auth, role("admin"), ctrl.abrir);
r.post("/cerrar",   auth, role("admin"), ctrl.cerrar);
r.get("/historial", auth, role("admin"), ctrl.getHistorial);
r.post("/pago",     auth, ctrl.registrarPago);
module.exports = r;