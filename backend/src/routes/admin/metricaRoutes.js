// backend/src/routes/admin/metricaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/metricaController");

/**
 * @swagger
 * /api/metricas/resumen:
 *   get:
 *     summary: Obtener resumen de métricas (solo admin)
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de ventas y pedidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricaResumen'
 *       403:
 *         description: Acceso denegado
 */
r.get("/resumen",       auth, role("admin"), ctrl.getResumen);

/**
 * @swagger
 * /api/metricas/ventas-por-dia:
 *   get:
 *     summary: Obtener ventas agrupadas por día (solo admin)
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Número de días a incluir
 *     responses:
 *       200:
 *         description: Datos de ventas diarias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   total:
 *                     type: number
 *       403:
 *         description: Acceso denegado
 */
r.get("/ventas-por-dia",auth, role("admin"), ctrl.getVentasPorDia);

/**
 * @swagger
 * /api/metricas/metodos-pago:
 *   get:
 *     summary: Obtener distribución de métodos de pago (solo admin)
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Distribución por método de pago
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   metodo:
 *                     type: string
 *                   total:
 *                     type: number
 *                   porcentaje:
 *                     type: number
 *       403:
 *         description: Acceso denegado
 */
r.get("/metodos-pago",  auth, role("admin"), ctrl.getMetodosPago);

module.exports = r;