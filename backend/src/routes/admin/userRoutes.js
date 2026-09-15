// backend/src/routes/admin/userRoutes.js
const r      = require("express").Router();
const auth   = require("../../middlewares/authMiddleware");
const role   = require("../../middlewares/roleMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const ctrl   = require("../../controllers/admin/userController");

/**
 * @swagger
 * /api/usuarios/sesiones:
 *   get:
 *     summary: Obtener todas las sesiones activas de usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.get("/sesiones", auth, tenant, role("admin"), ctrl.getSesiones);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener lista de todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.get("/",         auth, tenant, role("admin"), ctrl.getAll);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
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
 *               - correo
 *               - correo_personal
 *               - telefono
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: juan@mesasmart.com
 *               correo_personal:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@gmail.com
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *               rol:
 *                 type: string
 *                 enum: [admin, cocina, bartender]
 *                 example: cocina
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos (email duplicado, campos faltantes)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.post("/",        auth, tenant, role("admin"), ctrl.create);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Desactivar un usuario por ID (soft delete, no borra el registro)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a desactivar
 *     responses:
 *       200:
 *         description: Usuario desactivado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.delete("/:id",   auth, tenant, role("admin"), ctrl.remove);

/**
 * @swagger
 * /api/usuarios/{id}/reactivar:
 *   patch:
 *     summary: Reactivar un usuario previamente desactivado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a reactivar
 *     responses:
 *       200:
 *         description: Usuario reactivado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.patch("/:id/reactivar", auth, tenant, role("admin"), ctrl.reactivar);

module.exports = r;