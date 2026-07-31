// backend/src/routes/admin/proveedorRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const soloAdmin = require("../../middlewares/roleMiddleware"); // asumiendo firma roleMiddleware(["admin"])
const ctrl = require("../../controllers/admin/proveedorController");

/**
 * @swagger
 * /api/proveedores:
 *   post:
 *     summary: Crear un nuevo proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.post("/",   auth, soloAdmin(["admin"]), ctrl.crear);

/**
 * @swagger
 * /api/proveedores:
 *   get:
 *     summary: Listar proveedores (filtros opcionales por estado, categoria, busqueda)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.get("/",    auth, ctrl.getAll);

/**
 * @swagger
 * /api/proveedores/{id}:
 *   get:
 *     summary: Obtener un proveedor por ID
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.get("/:id", auth, ctrl.getById);

/**
 * @swagger
 * /api/proveedores/{id}:
 *   put:
 *     summary: Actualizar un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.put("/:id", auth, soloAdmin(["admin"]), ctrl.actualizar);

/**
 * @swagger
 * /api/proveedores/{id}/estado:
 *   patch:
 *     summary: Activar o desactivar un proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.patch("/:id/estado", auth, soloAdmin(["admin"]), ctrl.cambiarEstado);

/**
 * @swagger
 * /api/proveedores/{id}:
 *   delete:
 *     summary: Eliminar un proveedor (solo si no tiene facturas)
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 */
r.delete("/:id", auth, soloAdmin(["admin"]), ctrl.eliminar);

module.exports = r;
