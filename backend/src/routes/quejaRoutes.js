// backend/src/routes/quejaRoutes.js (o donde la tengas)
const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/quejaController");

/**
 * @swagger
 * /api/quejas:
 *   post:
 *     summary: Crear una nueva queja (acceso público)
 *     tags: [Quejas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *             properties:
 *               descripcion:
 *                 type: string
 *               mesa:
 *                 type: string
 *               usuarioId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Queja creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Queja'
 *       400:
 *         description: Datos inválidos
 */
router.post("/", ctrl.create);

/**
 * @swagger
 * /api/quejas:
 *   get:
 *     summary: Obtener todas las quejas (solo admin)
 *     tags: [Quejas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de quejas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Queja'
 *       403:
 *         description: Acceso denegado
 */
router.get("/", auth, role("admin"), ctrl.getAll);

/**
 * @swagger
 * /api/quejas/{id}/estado:
 *   patch:
 *     summary: Actualizar el estado de una queja (solo admin)
 *     tags: [Quejas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, resuelta]
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Queja no encontrada
 */
router.patch("/:id/estado", auth, role("admin"), ctrl.updateEstado);

module.exports = router;