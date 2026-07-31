const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const controller = require("../../controllers/admin/barController");

// El menú público crea las órdenes; la operación del bar exige una sesión autorizada.
router.post("/ordenes", controller.crear);
router.get("/ordenes", auth, role(["admin", "bartender"]), controller.activas);
router.get("/historial", auth, role(["admin", "bartender"]), controller.historialHoy);
router.get("/resumen", auth, role(["admin", "bartender"]), controller.resumen);
router.patch("/ordenes/:id/estado", auth, role(["admin", "bartender"]), controller.actualizarEstado);
router.get("/inventario", auth, role(["admin", "bartender"]), controller.inventario);
router.post("/inventario/consumos", auth, role(["admin", "bartender"]), controller.registrarConsumo);

module.exports = router;
