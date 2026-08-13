const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const publicTenant = require("../../middlewares/publicTenantMiddleware");
const role = require("../../middlewares/roleMiddleware");
const controller = require("../../controllers/admin/barController");

// El menú público crea las órdenes; la operación del bar exige una sesión autorizada.
router.post(["/ordenes", "/:slug/ordenes"], publicTenant, controller.crear);
router.get("/ordenes", auth, tenant, role(["admin", "bartender"]), controller.activas);
router.get("/historial", auth, tenant, role(["admin", "bartender"]), controller.historialHoy);
router.get("/resumen", auth, tenant, role(["admin", "bartender"]), controller.resumen);
router.patch("/ordenes/:id/estado", auth, tenant, role(["admin", "bartender"]), controller.actualizarEstado);
router.get("/inventario", auth, tenant, role(["admin", "bartender"]), controller.inventario);
router.post("/inventario/consumos", auth, tenant, role(["admin", "bartender"]), controller.registrarConsumo);

module.exports = router;