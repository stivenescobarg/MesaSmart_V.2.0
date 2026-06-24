// backend/src/routes/admin/stockRoutes.js
// Agrega: GET /api/stock/cocina (sin auth, para panel cocina)
//         POST /api/stock/validar-pin (sin auth, para panel cocina)

const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/stockController");

// ── Rutas del admin (protegidas) ──────────────────────────────────

/**
 * @swagger
 * /api/stock:
 *   get:
 *     summary: Obtener todo el inventario (solo admin)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos en stock
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
 *                   categoria:
 *                     type: string
 *                   cantidad:
 *                     type: integer
 *                   precio:
 *                     type: number
 *                   imagen:
 *                     type: string
 *                   bajoStock:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado
 */
r.get("/",                auth, role("admin"), ctrl.getAll);

/**
 * @swagger
 * /api/stock/bajo-stock:
 *   get:
 *     summary: Obtener productos con bajo stock (solo admin)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos con stock crítico
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stock'
 *       403:
 *         description: Acceso denegado
 */
r.get("/bajo-stock",      auth, role("admin"), ctrl.getBajoStock);

/**
 * @swagger
 * /api/stock/resumen:
 *   get:
 *     summary: Obtener resumen del inventario (solo admin)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de cantidades y valores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProductos:
 *                   type: integer
 *                 valorTotal:
 *                   type: number
 *                 categorias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoria:
 *                         type: string
 *                       cantidad:
 *                         type: integer
 *                       valor:
 *                         type: number
 *       403:
 *         description: Acceso denegado
 */
r.get("/resumen",         auth, role("admin"), ctrl.getResumen);

/**
 * @swagger
 * /api/stock:
 *   post:
 *     summary: Crear un nuevo producto en stock (solo admin)
 *     tags: [Stock]
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
 *               - categoria
 *               - cantidad
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Tomates
 *               categoria:
 *                 type: string
 *                 example: Verduras
 *               cantidad:
 *                 type: integer
 *                 example: 50
 *               precio:
 *                 type: number
 *                 example: 2.5
 *               imagen:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       403:
 *         description: Acceso denegado
 */
r.post("/",               auth, role("admin"), ctrl.create);

/**
 * @swagger
 * /api/stock/{id}:
 *   patch:
 *     summary: Actualizar un producto del stock (solo admin)
 *     tags: [Stock]
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
 *               categoria:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               precio:
 *                 type: number
 *               imagen:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       404:
 *         description: Producto no encontrado
 *       403:
 *         description: Acceso denegado
 */
r.patch("/:id",           auth, role("admin"), ctrl.update);

/**
 * @swagger
 * /api/stock/{id}:
 *   delete:
 *     summary: Eliminar un producto del stock (solo admin)
 *     tags: [Stock]
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
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 *       403:
 *         description: Acceso denegado
 */
r.delete("/:id",          auth, role("admin"), ctrl.remove);

/**
 * @swagger
 * /api/stock/movimientos:
 *   post:
 *     summary: Registrar un movimiento de stock (entrada/salida) (solo admin)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - tipo
 *               - cantidad
 *             properties:
 *               productoId:
 *                 type: integer
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida]
 *               cantidad:
 *                 type: integer
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento registrado
 *       403:
 *         description: Acceso denegado
 */
r.post("/movimientos",    auth, role("admin"), ctrl.registrarMovimiento);

/**
 * @swagger
 * /api/stock/{id}/movimientos:
 *   get:
 *     summary: Obtener historial de movimientos de un producto (solo admin)
 *     tags: [Stock]
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
 *         description: Historial de movimientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tipo:
 *                     type: string
 *                   cantidad:
 *                     type: integer
 *                   fecha:
 *                     type: string
 *                     format: date-time
 *                   motivo:
 *                     type: string
 *       403:
 *         description: Acceso denegado
 */
r.get("/:id/movimientos", auth, role("admin"), ctrl.getMovimientos);

// ── Rutas para panel de COCINA (sin auth de admin, usan PIN) ─────

/**
 * @swagger
 * /api/stock/cocina/productos:
 *   get:
 *     summary: Obtener productos de cocina (acceso con PIN)
 *     tags: [Stock]
 *     description: Esta ruta no requiere token JWT, solo PIN enviado por header
 *     parameters:
 *       - in: header
 *         name: x-pin
 *         schema:
 *           type: string
 *         required: true
 *         description: PIN de cocina
 *     responses:
 *       200:
 *         description: Lista de productos de cocina
 *       401:
 *         description: PIN inválido
 */
r.get("/cocina/productos",  ctrl.getCocina);

/**
 * @swagger
 * /api/stock/cocina/movimiento:
 *   post:
 *     summary: Registrar movimiento de stock desde cocina (con PIN)
 *     tags: [Stock]
 *     parameters:
 *       - in: header
 *         name: x-pin
 *         schema:
 *           type: string
 *         required: true
 *         description: PIN de cocina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - cantidad
 *             properties:
 *               productoId:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento registrado
 *       401:
 *         description: PIN inválido
 */
r.post("/cocina/movimiento", ctrl.registrarMovCocina);

/**
 * @swagger
 * /api/stock/cocina/validar-pin:
 *   post:
 *     summary: Validar PIN de cocina
 *     tags: [Stock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                 mensaje:
 *                   type: string
 *       400:
 *         description: PIN inválido
 */
r.post("/cocina/validar-pin", ctrl.validarPin);

module.exports = r;