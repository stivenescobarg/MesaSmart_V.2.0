// backend/src/routes/admin/cajaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/cajaController");

/**
 * @swagger
 * /api/caja/estado:
 *   get:
 *     summary: Obtener estado actual de la caja
 *     description: Retorna información de la caja actual (abierta/cerrada, saldo, etc.)
 *     tags: [Caja]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de la caja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 abierta:
 *                   type: boolean
 *                 saldo:
 *                   type: number
 *                   example: 50000
 *                 apertura:
 *                   type: string
 *                   format: date-time
 *                 cajaId:
 *                   type: integer
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
r.get("/estado", auth, ctrl.getEstado);

/**
 * @swagger
 * /api/caja/abrir:
 *   post:
 *     summary: Abrir caja (solo administradores)
 *     description: Inicia una nueva sesión de caja con un monto inicial.
 *     tags: [Caja]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               montoInicial:
 *                 type: number
 *                 example: 50000
 *                 description: Monto inicial en efectivo
 *               notas:
 *                 type: string
 *                 example: "Apertura de caja turno mañana"
 *     responses:
 *       200:
 *         description: Caja abierta exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 caja:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     apertura:
 *                       type: string
 *                       format: date-time
 *                     saldo:
 *                       type: number
 *       400:
 *         description: Ya hay una caja abierta
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       500:
 *         description: Error interno
 */
r.post("/abrir", auth, role("admin"), ctrl.abrir);

/**
 * @swagger
 * /api/caja/cerrar:
 *   post:
 *     summary: Cerrar caja (solo administradores)
 *     description: Finaliza la sesión de caja actual.
 *     tags: [Caja]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notas:
 *                 type: string
 *                 example: "Cierre de caja turno mañana"
 *               montoFinal:
 *                 type: number
 *                 example: 75000
 *     responses:
 *       200:
 *         description: Caja cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cierre:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     cierre:
 *                       type: string
 *                       format: date-time
 *                     saldoFinal:
 *                       type: number
 *       400:
 *         description: No hay caja abierta
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 *       500:
 *         description: Error interno
 */
r.post("/cerrar", auth, role("admin"), ctrl.cerrar);

/**
 * @swagger
 * /api/caja/historial:
 *   get:
 *     summary: Obtener historial de movimientos de caja
 *     description: Retorna el historial de operaciones de caja con filtros opcionales.
 *     tags: [Caja]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [apertura, cierre, pago, egreso]
 *         description: Filtrar por tipo de operación
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Historial obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tipo:
 *                         type: string
 *                       monto:
 *                         type: number
 *                       fecha:
 *                         type: string
 *                         format: date-time
 *                       notas:
 *                         type: string
 *                       usuario:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nombre:
 *                             type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno
 */
r.get("/historial", auth, role("admin"), ctrl.getHistorial);

/**
 * @swagger
 * /api/caja/pago:
 *   post:
 *     summary: Registrar un pago (cualquier usuario autenticado)
 *     description: Registra un pago en la caja actual.
 *     tags: [Caja]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pedidoId
 *               - monto
 *               - metodoPago
 *             properties:
 *               pedidoId:
 *                 type: integer
 *                 example: 123
 *               monto:
 *                 type: number
 *                 example: 45000
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia, otros]
 *                 example: efectivo
 *               notas:
 *                 type: string
 *                 example: "Pago de mesa 5"
 *     responses:
 *       200:
 *         description: Pago registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pago:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     pedidoId:
 *                       type: integer
 *                     monto:
 *                       type: number
 *                     metodoPago:
 *                       type: string
 *                     fecha:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No hay caja abierta o validación fallida
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error interno
 */
r.post("/pago", auth, ctrl.registrarPago);

module.exports = r;