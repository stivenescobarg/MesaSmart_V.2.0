// backend/src/routes/admin/egresoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const requierePlan = require("../../middlewares/requierePlan");
const ctrl = require("../../controllers/admin/egresoController");

r.post("/",   auth, tenant, requierePlan("gastos"), ctrl.crear);
r.get("/",    auth, tenant, requierePlan("gastos"), ctrl.getByCajaActual);
r.get("/categorias", auth, tenant, requierePlan("gastos"), ctrl.getCategorias);
r.get("/historial", auth, tenant, requierePlan("gastos"), ctrl.getHistorial);
r.get("/graficos", auth, tenant, requierePlan("gastos"), ctrl.getGraficos);

module.exports = r;