// backend/src/routes/admin/dashboardFinancieroRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const requierePlan = require("../../middlewares/requierePlan");
const ctrl = require("../../controllers/admin/dashboardFinancieroController");

r.get("/", auth, tenant, requierePlan("dashboard_financiero"), ctrl.getResumen);

r.get("/reporte", auth, tenant, requierePlan("dashboard_financiero"), ctrl.getReportePeriodo);
r.get("/reporte/excel", auth, tenant, requierePlan("exportacion_excel"), ctrl.exportarExcel);

r.get("/ventas-vs-gastos", auth, tenant, requierePlan("dashboard_financiero"), ctrl.getVentasVsGastos);

module.exports = r;