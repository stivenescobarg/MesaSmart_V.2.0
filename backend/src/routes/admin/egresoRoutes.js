// backend/src/routes/admin/egresoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/egresoController");

/**
 * @swagger
 * /api/egresos:
 *   post:
 *     summary: Registrar un nuevo egreso (gasto), requiere caja abierta
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 */
r.post("/",   auth, ctrl.crear);

/**
 * @swagger
 * /api/egresos:
 *   get:
 *     summary: Obtener los egresos de la caja actualmente abierta
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 */
r.get("/",    auth, ctrl.getByCajaActual);

/**
 * @swagger
 * /api/egresos/categorias:
 *   get:
 *     summary: Lista de categorías válidas para egresos
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 */
r.get("/categorias", auth, ctrl.getCategorias);

/**
 * @swagger
 * /api/egresos/historial:
 *   get:
 *     summary: Historial de egresos con filtros (periodo=hoy|semana|mes|anio|personalizado, fecha_desde, fecha_hasta, categoria)
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 */
r.get("/historial", auth, ctrl.getHistorial);

/**
 * @swagger
 * /api/egresos/graficos:
 *   get:
 *     summary: Datos agregados (por categoría y por día) para gráficos del módulo de Control de Gastos
 *     tags: [Egresos]
 *     security:
 *       - bearerAuth: []
 */
r.get("/graficos", auth, ctrl.getGraficos);

module.exports = r;