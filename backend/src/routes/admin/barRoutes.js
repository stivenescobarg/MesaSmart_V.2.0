// backend/src/routes/admin/barRoutes.js
const router = require("express").Router();
const { pool } = require("../../config/db");
const auth = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const publicTenant = require("../../middlewares/publicTenantMiddleware");
const role = require("../../middlewares/roleMiddleware");
const controller = require("../../controllers/admin/barController");
const barSecurityService = require("../../services/barSecurityService");

// El menú público crea las órdenes; la operación del bar exige una sesión autorizada.
router.post(["/ordenes", "/:slug/ordenes"], publicTenant, controller.crear);
router.get("/ordenes/mesa/:mesaId", async (req, res) => {
  try {
    const { mesaId } = req.params;
    const { restaurante_id } = req.query;
    if (!restaurante_id) return res.status(400).json({ error: "restaurante_id requerido" });

    // El cliente pide desde el QR y quejaMesa se autocompleta con String(mesaId),
    // así que ordenes_bar.mesa queda guardado como ese mismo texto (ej: "53").
    const [ordenes] = await pool.query(
      `SELECT items FROM ordenes_bar
       WHERE mesa = ? AND restaurante_id = ? AND estado NOT IN ('pagado','cancelado')`,
      [String(mesaId), restaurante_id]
    );

    const resultado = ordenes.flatMap(o => {
      let items = [];
      try { items = typeof o.items === "string" ? JSON.parse(o.items) : (o.items || []); } catch { items = []; }
      return items.map(i => ({
        nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, categoria: "bar",
      }));
    });

    res.json(resultado);
  } catch (err) {
    console.error("[GET /bar/ordenes/mesa/:mesaId]", err);
    res.status(500).json({ error: "Error al obtener pedidos de bar de la mesa" });
  }
});

router.get("/ordenes", auth, tenant, role(["admin", "bartender"]), controller.activas);
router.get("/historial", auth, tenant, role(["admin", "bartender"]), controller.historialHoy);
router.get("/resumen", auth, tenant, role(["admin", "bartender"]), controller.resumen);
router.get("/inventario", auth, tenant, role(["admin", "bartender"]), controller.inventario);
router.get("/actividad", auth, tenant, role(["admin", "bartender"]), controller.actividad);

router.patch("/ordenes/:id/estado", auth, tenant, role(["admin", "bartender"]), controller.actualizarEstado);
router.patch("/ordenes/:id/pagar-parcial", auth, tenant, role(["admin", "bartender"]), controller.pagarParcial);

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