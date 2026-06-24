// backend/src/routes/admin/pedidoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/pedidoController");

// ── Rutas generales ──────────────────────────────────────────────

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener lista de pedidos (con filtros opcionales)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_preparacion, listo, pagado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: mesa
 *         schema:
 *           type: string
 *         description: Filtrar por número de mesa
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       401:
 *         description: No autorizado
 */
r.get("/",             auth, ctrl.getPedidos);

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mesa
 *               - items
 *             properties:
 *               mesa:
 *                 type: string
 *                 example: Mesa 5
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
 *                     observacion:
 *                       type: string
 *                     imagen:
 *                       type: string
 *               notas:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pedido creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
r.post("/",            auth, ctrl.createPedido);

/**
 * @swagger
 * /api/pedidos/estados:
 *   get:
 *     summary: Obtener lista de estados posibles de pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [pendiente, en_preparacion, listo, pagado]
 */
r.get("/estados",      auth, ctrl.getEstados);

/**
 * @swagger
 * /api/pedidos/categorias:
 *   get:
 *     summary: Obtener categorías de productos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
r.get("/categorias",   auth, ctrl.getCategorias);

/**
 * @swagger
 * /api/pedidos/cocinero:
 *   get:
 *     summary: Obtener datos del turno del cocinero actual
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del turno
 */
r.get("/cocinero",     auth, ctrl.getCocineroTurno);

/**
 * @swagger
 * /api/pedidos/mesa/{mesa_id}:
 *   get:
 *     summary: Obtener pedidos de una mesa específica
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la mesa
 *     responses:
 *       200:
 *         description: Pedidos de la mesa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       404:
 *         description: Mesa no encontrada
 */
r.get("/mesa/:mesa_id", auth, ctrl.getByMesa);

/**
 * @swagger
 * /api/pedidos/{id}/estado:
 *   patch:
 *     summary: Actualizar estado de un pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
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
 *                 enum: [pendiente, en_preparacion, listo]
 *                 example: en_preparacion
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Estado inválido
 *       404:
 *         description: Pedido no encontrado
 */
r.patch("/:id/estado", auth, ctrl.updateEstadoPedido);

// ── Rutas de items ───────────────────────────────────────────────

/**
 * @swagger
 * /api/pedidos/items/mover:
 *   patch:
 *     summary: Mover items de un pedido a otro (o a otra mesa)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - destinoMesa
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de los items a mover
 *               destinoMesa:
 *                 type: string
 *                 description: Número o nombre de la mesa destino
 *     responses:
 *       200:
 *         description: Items movidos exitosamente
 *       400:
 *         description: Datos inválidos
 */
r.patch("/items/mover",      auth, ctrl.moverItems);

/**
 * @swagger
 * /api/pedidos/items/{item_id}:
 *   patch:
 *     summary: Actualizar cantidad de un item
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemPedido'
 *       404:
 *         description: Item no encontrado
 */
r.patch("/items/:item_id",   auth, ctrl.updateItem);

/**
 * @swagger
 * /api/pedidos/items/{item_id}:
 *   delete:
 *     summary: Eliminar un item del pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del item
 *     responses:
 *       200:
 *         description: Item eliminado
 *       404:
 *         description: Item no encontrado
 */
r.delete("/items/:item_id",  auth, ctrl.deleteItem);

module.exports = r;