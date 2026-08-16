// backend/src/routes/admin/dashboardFinancieroRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const ctrl = require("../../controllers/admin/dashboardFinancieroController");

/**
 * @swagger
 * /api/dashboard-financiero:
 *   get:
 *     summary: KPIs financieros, comparativas vs ayer/semana/mes, y facturas pendientes
 *     tags: [DashboardFinanciero]
 *     security:
 *       - bearerAuth: []
 */
r.get("/", auth, tenant, ctrl.getResumen);

r.get("/reporte", auth, tenant, ctrl.getReportePeriodo);
r.get("/reporte/excel", auth, tenant, ctrl.exportarExcel);

/**
 * @swagger
 * /api/dashboard-financiero/ventas-vs-gastos:
 *   get:
 *     summary: Serie de ventas vs gastos de los últimos 7 días
 *     tags: [DashboardFinanciero]
 *     security:
 *       - bearerAuth: []
 */
r.get("/ventas-vs-gastos", auth, tenant, ctrl.getVentasVsGastos);

module.exports = r;