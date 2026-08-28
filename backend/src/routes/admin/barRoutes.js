// backend/src/routes/admin/barRoutes.js
const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const controller = require("../../controllers/admin/barController");
const barSecurityService = require("../../services/barSecurityService");

// Ruta pública (el menú del cliente crea órdenes sin login)
router.post("/ordenes", controller.crear);

// Rutas protegidas por autenticación + rol
router.get(
  "/ordenes",
  auth,
  role(["admin", "bartender"]),
  controller.activas
);
router.get(
  "/historial",
  auth,
  role(["admin", "bartender"]),
  controller.historialHoy
);
router.get(
  "/resumen",
  auth,
  role(["admin", "bartender"]),
  controller.resumen
);
router.get(
  "/inventario",
  auth,
  role(["admin", "bartender"]),
  controller.inventario
);
router.get(
  "/actividad",
  auth,
  role(["admin", "bartender"]),
  controller.actividad
);

router.patch(
  "/ordenes/:id/estado",
  auth,
  role(["admin", "bartender"]),
  controller.actualizarEstado
);

// Consumo manual (requiere PIN)
router.post(
  "/inventario/consumos",
  auth,
  role(["admin", "bartender"]),
  async (req, res, next) => {
    const { pin } = req.body;
    const restaurante_id = req.usuario?.restaurante_id;

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