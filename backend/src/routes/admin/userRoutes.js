// backend/src/routes/admin/userRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/userController");

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
 *                   token:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.get("/sesiones", auth, role("admin"), ctrl.getSesiones);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.get("/",         auth, role("admin"), ctrl.getAll);

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
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@mesasmart.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *               rol:
 *                 type: string
 *                 enum: [admin, cocinero, bartender, mesero]
 *                 example: mesero
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos (email duplicado, campos faltantes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.post("/",        auth, role("admin"), ctrl.create);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo administradores)
 */
r.delete("/:id",   auth, role("admin"), ctrl.remove);

module.exports = r;