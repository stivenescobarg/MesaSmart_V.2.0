// backend/src/routes/admin/egresoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/egresoController");

/**
 * @swagger
 * /api/egresos:
 *   post:
 *     summary: Registrar un nuevo egreso (gasto)
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *               - monto
 *               - categoria
 *             properties:
 *               descripcion:
 *                 type: string
 *                 example: Compra de verduras
 *               monto:
 *                 type: number
 *                 example: 15000
 *               categoria:
 *                 type: string
 *                 example: Insumos
 *     responses:
 *       201:
 *         description: Egreso creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Egreso'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 */
r.post("/",   auth, ctrl.crear);

/**
 * @swagger
 * /api/egresos:
 *   get:
 *     summary: Obtener todos los egresos de la caja actual
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de egresos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Egreso'
 *       401:
 *         description: No autorizado
 */
r.get("/",    auth, ctrl.getByCajaActual);

module.exports = r;