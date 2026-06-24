// backend/src/routes/pedidos.js
const express  = require("express");
const router   = express.Router();
const { pool } = require("../config/db");

/**
 * @swagger
 * /api/pedidos-cocina:
 *   get:
 *     summary: Obtener pedidos para la cocina (pendientes, en preparación, listos)
 *     tags: [Cocina]
 *     responses:
 *       200:
 *         description: Lista de pedidos con ítems de comida
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   estado:
 *                     type: string
 *                     enum: [pendiente, en_preparacion, listo]
 *                   observacion:
 *                     type: string
 *                   creado_en:
 *                     type: string
 *                     format: date-time
 *                   mesa:
 *                     type: string
 *                   hora:
 *                     type: string
 *                     format: date-time
 *                   notas:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                         cantidad:
 *                           type: integer
 *                         precio:
 *                           type: number
 *                         categoria:
 *                           type: string
 *                         observacion:
 *                           type: string
 *                         imagen:
 *                           type: string
 *                           nullable: true
 *       500:
 *         description: Error del servidor
 */
router.get("/", async (req, res) => {
  // ... (tu código actual)
});

/**
 * @swagger
 * /api/pedidos-cocina:
 *   post:
 *     summary: Crear un nuevo pedido desde el menú
 *     tags: [Cocina]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               mesa_id:
 *                 type: integer
 *               mesa_nombre:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nombre
 *                     - cantidad
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *                     precio:
 *                       type: number
 *                     categoria:
 *                       type: string
 *                     observacion:
 *                       type: string
 *               observacion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 pedido_id:
 *                   type: integer
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post("/", async (req, res) => {
  // ... (tu código actual)
});

/**
 * @swagger
 * /api/pedidos-cocina/{id}/estado:
 *   patch:
 *     summary: Actualizar el estado de un pedido
 *     tags: [Cocina]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pedido
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
 *                 enum: [pendiente, en_preparacion, listo, pagado, cancelado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 *       500:
 *         description: Error del servidor
 */
router.patch("/:id/estado", async (req, res) => {
  // ... (tu código actual)
});

module.exports = router;