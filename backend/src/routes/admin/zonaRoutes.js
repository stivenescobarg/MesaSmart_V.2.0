// backend/src/routes/admin/zonaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/zonaController");

/**
 * @swagger
 * /api/zonas:
 *   get:
 *     summary: Obtener todas las zonas del restaurante
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de zonas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *       401:
 *         description: No autorizado
 */
r.get("/",         auth, ctrl.getAll);

/**
 * @swagger
 * /api/zonas:
 *   post:
 *     summary: Crear una nueva zona (solo admin)
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Terraza
 *               descripcion:
 *                 type: string
 *                 example: Zona exterior con sombrillas
 *     responses:
 *       201:
 *         description: Zona creada
 *       403:
 *         description: Acceso denegado (solo admin)
 */
r.post("/",        auth, role("admin"), ctrl.create);

/**
 * @swagger
 * /api/zonas/{id}:
 *   patch:
 *     summary: Actualizar una zona (solo admin)
 *     tags: [Zonas]
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zona actualizada
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Zona no encontrada
 */
r.patch("/:id",    auth, role("admin"), ctrl.update);

/**
 * @swagger
 * /api/zonas/{id}:
 *   delete:
 *     summary: Eliminar una zona (solo admin)
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zona eliminada
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Zona no encontrada
 */
r.delete("/:id",   auth, role("admin"), ctrl.remove);

module.exports = r;