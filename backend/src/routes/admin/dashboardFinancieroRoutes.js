// backend/src/routes/admin/dashboardFinancieroRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
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
r.get("/", auth, ctrl.getResumen);

/**
 * @swagger
 * /api/dashboard-financiero/ventas-vs-gastos:
 *   get:
 *     summary: Serie de ventas vs gastos de los últimos 7 días
 *     tags: [DashboardFinanciero]
 *     security:
 *       - bearerAuth: []
 */
r.get("/ventas-vs-gastos", auth, ctrl.getVentasVsGastos);

module.exports = r;