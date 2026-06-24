// backend/src/routes/admin/sesionRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/sesionController");

/**
 * @swagger
 * /api/sesiones:
 *   get:
 *     summary: Obtener todas las sesiones activas de usuarios
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   usuarioId:
 *                     type: integer
 *                   usuarioNombre:
 *                     type: string
 *                   usuarioEmail:
 *                     type: string
 *                   token:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.get("/",                          auth, role("admin"), ctrl.getSesiones);

/**
 * @swagger
 * /api/sesiones/forzar/{usuario_id}:
 *   delete:
 *     summary: Forzar cierre de sesión de un usuario (solo admin)
 *     tags: [Sesiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario al que se le forzará el logout
 *     responses:
 *       200:
 *         description: Sesión cerrada forzosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada forzosamente
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Acceso denegado (solo admin)
 */
r.delete("/forzar/:usuario_id",     auth, role("admin"), ctrl.forzarLogout);

module.exports = r;