// backend/src/routes/productos.js
const express = require("express");
const router  = express.Router();
const { pool } = require("../config/db");

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Obtener el menú completo con categorías, subcategorías, opciones y adiciones
 *     tags: [Menú]
 *     responses:
 *       200:
 *         description: Lista de productos del menú
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       500:
 *         description: Error del servidor
 */
router.get("/", async (req, res) => {
  // ... (tu código actual)
});

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Agregar un nuevo producto al menú
 *     tags: [Menú]
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
 *               - precio
 *               - categoria_id
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               categoria_id:
 *                 type: integer
 *               imagen:
 *                 type: string
 *               tiene_termino:
 *                 type: boolean
 *               adiciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     precio:
 *                       type: number
 *     responses:
 *       200:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 id:
 *                   type: integer
 *       400:
 *         description: Datos incompletos
 *       500:
 *         description: Error del servidor
 */
router.post("/", async (req, res) => {
  // ... (tu código actual)
});

/**
 * @swagger
 * /api/menu/categorias:
 *   get:
 *     summary: Obtener lista de categorías disponibles
 *     tags: [Menú]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *       500:
 *         description: Error del servidor
 */
router.get("/categorias", async (req, res) => {
  // ... (tu código actual)
});

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Editar un producto existente
 *     tags: [Menú]
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
 *               precio:
 *                 type: number
 *               imagen:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id", async (req, res) => {
  // ... (tu código actual)
});

module.exports = router;