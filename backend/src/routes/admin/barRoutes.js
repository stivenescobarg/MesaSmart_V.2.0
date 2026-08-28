// backend/src/routes/admin/barRoutes.js
const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const publicTenant = require("../../middlewares/publicTenantMiddleware");
const role = require("../../middlewares/roleMiddleware");
const controller = require("../../controllers/admin/barController");
const barSecurityService = require("../../services/barSecurityService");

// El menú público crea las órdenes; la operación del bar exige una sesión autorizada.
router.post(["/ordenes", "/:slug/ordenes"], publicTenant, controller.crear);

router.get("/ordenes", auth, tenant, role(["admin", "bartender"]), controller.activas);
router.get("/historial", auth, tenant, role(["admin", "bartender"]), controller.historialHoy);
router.get("/resumen", auth, tenant, role(["admin", "bartender"]), controller.resumen);
router.get("/inventario", auth, tenant, role(["admin", "bartender"]), controller.inventario);
router.get("/actividad", auth, tenant, role(["admin", "bartender"]), controller.actividad);

router.patch("/ordenes/:id/estado", auth, tenant, role(["admin", "bartender"]), controller.actualizarEstado);

// Consumo manual (requiere PIN)
router.post(
  "/inventario/consumos",
  auth,
  tenant,
  role(["admin", "bartender"]),
  async (req, res, next) => {
    const { pin } = req.body;
    const restaurante_id = req.restaurante_id;

    const validacion = await barSecurityService.validarPin(
      pin,
      restaurante_id,
      req.usuario?.id || null,
      req.ip || req.connection.remoteAddress || null,
      "consumo_manual"
    );

    if (!validacion.valido) {
      return res.status(403).json({
        ok: false,
        msg: validacion.mensaje,
        codigo: validacion.codigo,
        intentos_restantes: validacion.intentos_restantes || 0,
      });
    }

    next();
  },
  controller.registrarConsumo
);

module.exports = router;