// backend/src/routes/admin/analiticaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const ctrl = require("../../controllers/admin/analiticaController");

/**
 * @swagger
 * /api/analitica/ventas-agrupadas:
 *   get:
 *     summary: Ventas agrupadas por dia, semana o mes (query agrupacion=dia|semana|mes)
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/ventas-agrupadas", auth, tenant, ctrl.getVentasAgrupadas);

/**
 * @swagger
 * /api/analitica/ingresos-vs-gastos:
 *   get:
 *     summary: Serie diaria de ingresos, gastos y flujo neto en un rango
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/ingresos-vs-gastos", auth, tenant, ctrl.getIngresosVsGastos);

/**
 * @swagger
 * /api/analitica/categorias-mas-vendidas:
 *   get:
 *     summary: Categorias mas vendidas por ingresos y unidades
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/categorias-mas-vendidas", auth, tenant, ctrl.getCategoriasMasVendidas);

/**
 * @swagger
 * /api/analitica/top-productos:
 *   get:
 *     summary: Productos mas vendidos (query limit, default 5)
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/top-productos", auth, tenant, ctrl.getTopProductos);

/**
 * @swagger
 * /api/analitica/productos-menor-rotacion:
 *   get:
 *     summary: Productos con menor rotacion (incluye ventas en 0, todo el catalogo)
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/productos-menor-rotacion", auth, tenant, ctrl.getProductosMenorRotacion);

/**
 * @swagger
 * /api/analitica/metodos-pago:
 *   get:
 *     summary: Metodos de pago en un rango de fechas
 *     tags: [Analitica]
 *     security: [{ bearerAuth: [] }]
 */
r.get("/metodos-pago", auth, tenant, ctrl.getMetodosPago);

module.exports = r;