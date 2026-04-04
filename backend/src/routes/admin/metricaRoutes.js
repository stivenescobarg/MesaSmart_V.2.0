// backend/src/routes/admin/metricaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/metricaController");

r.get("/resumen",       auth, role("admin"), ctrl.getResumen);
r.get("/ventas-por-dia",auth, role("admin"), ctrl.getVentasPorDia);
r.get("/metodos-pago",  auth, role("admin"), ctrl.getMetodosPago);
module.exports = r;