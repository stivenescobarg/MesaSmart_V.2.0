// backend/src/routes/admin/mesaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/mesaController");

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Obtener todas las mesas
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mesa'
 *       401:
 *         description: No autorizado
 */
r.get("/",                    auth, ctrl.getAll);

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Crear una nueva mesa (solo admin)
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - zona
 *               - capacidad
 *             properties:
 *               numero:
 *                 type: integer
 *                 example: 5
 *               zona:
 *                 type: string
 *                 example: Terraza
 *               capacidad:
 *                 type: integer
 *                 example: 4
 *               posicionX:
 *                 type: number
 *                 example: 100
 *               posicionY:
 *                 type: number
 *                 example: 200
 *     responses:
 *       201:
 *         description: Mesa creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mesa'
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Acceso denegado (solo admin)
 */
r.post("/",                   auth, role("admin"), ctrl.create);

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Eliminar una mesa (solo admin)
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la mesa
 *     responses:
 *       200:
 *         description: Mesa eliminada
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Mesa no encontrada
 */
r.delete("/:id",              auth, role("admin"), ctrl.remove);

/**
 * @swagger
 * /api/mesas/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de una mesa
 *     tags: [Mesas]
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
 *                 enum: [libre, ocupada, reservada]
 *                 example: ocupada
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 */
r.patch("/:id/estado",        auth, ctrl.updateEstado);

/**
 * @swagger
 * /api/mesas/{id}/posicion:
 *   patch:
 *     summary: Actualizar posición de una mesa (solo admin)
 *     tags: [Mesas]
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
 *               - posicionX
 *               - posicionY
 *             properties:
 *               posicionX:
 *                 type: number
 *               posicionY:
 *                 type: number
 *     responses:
 *       200:
 *         description: Posición actualizada
 *       403:
 *         description: Acceso denegado
 */
r.patch("/:id/posicion",      auth, role("admin"), ctrl.updatePosicion);

/**
 * @swagger
 * /api/mesas/{id}/config:
 *   patch:
 *     summary: Actualizar configuración de una mesa (solo admin)
 *     tags: [Mesas]
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
 *             properties:
 *               capacidad:
 *                 type: integer
 *               zona:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       403:
 *         description: Acceso denegado
 */
r.patch("/:id/config",        auth, role("admin"), ctrl.updateConfig);

/**
 * @swagger
 * /api/mesas/batch/posiciones:
 *   patch:
 *     summary: Actualizar posiciones de múltiples mesas (solo admin)
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - posicionX
 *                 - posicionY
 *               properties:
 *                 id:
 *                   type: integer
 *                 posicionX:
 *                   type: number
 *                 posicionY:
 *                   type: number
 *     responses:
 *       200:
 *         description: Posiciones actualizadas
 *       403:
 *         description: Acceso denegado
 */
r.patch("/batch/posiciones",  auth, role("admin"), ctrl.updatePosicionBatch);

module.exports = r;