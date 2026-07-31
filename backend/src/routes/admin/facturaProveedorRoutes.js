// backend/src/routes/admin/facturaProveedorRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const soloAdmin = require("../../middlewares/roleMiddleware"); // asumiendo firma roleMiddleware(["admin"])
const ctrl = require("../../controllers/admin/facturaProveedorController");

/**
 * @swagger
 * /api/facturas-proveedor:
 *   post:
 *     summary: Registrar una nueva factura (cuenta por pagar)
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.post("/",   auth, soloAdmin(["admin"]), ctrl.crear);

/**
 * @swagger
 * /api/facturas-proveedor:
 *   get:
 *     summary: Listar facturas (filtros por proveedor_id, estado, fecha_desde, fecha_hasta, vencidas, proximas)
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.get("/",    auth, ctrl.getAll);

/**
 * @swagger
 * /api/facturas-proveedor/indicadores:
 *   get:
 *     summary: Indicadores de cuentas por pagar (total por pagar, pagado, vencidas, próximas)
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.get("/indicadores", auth, ctrl.getIndicadores);

/**
 * @swagger
 * /api/facturas-proveedor/{id}:
 *   get:
 *     summary: Obtener una factura con su historial de pagos
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.get("/:id", auth, ctrl.getById);

/**
 * @swagger
 * /api/facturas-proveedor/{id}/pagos:
 *   post:
 *     summary: Registrar un abono/pago sobre una factura
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.post("/:id/pagos", auth, soloAdmin(["admin"]), ctrl.registrarPago);

/**
 * @swagger
 * /api/facturas-proveedor/{id}:
 *   delete:
 *     summary: Eliminar una factura
 *     tags: [CuentasPorPagar]
 *     security:
 *       - bearerAuth: []
 */
r.delete("/:id", auth, soloAdmin(["admin"]), ctrl.eliminar);

module.exports = r;
