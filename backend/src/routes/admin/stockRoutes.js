const r      = require("express").Router();
const auth   = require("../../middlewares/authMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const publicTenant = require("../../middlewares/publicTenantMiddleware");
const role   = require("../../middlewares/roleMiddleware");
const ctrl   = require("../../controllers/admin/stockController");

// (bloques @swagger sin cambios, omitidos aquí)

// ── Admin (protegidas) ──
r.get("/",                auth, tenant, role("admin"), ctrl.getAll);
r.get("/bajo-stock",      auth, tenant, role("admin"), ctrl.getBajoStock);
r.get("/resumen",         auth, tenant, role("admin"), ctrl.getResumen);
r.post("/",               auth, tenant, role("admin"), ctrl.create);
r.patch("/:id",           auth, tenant, role("admin"), ctrl.update);
r.delete("/:id",          auth, tenant, role("admin"), ctrl.remove);
r.post("/movimientos",    auth, tenant, role("admin"), ctrl.registrarMovimiento);
r.get("/:id/movimientos", auth, tenant, role("admin"), ctrl.getMovimientos);

// ── Cocina (sin auth, con PIN + publicTenant) ──
r.get(["/cocina/productos", "/:slug/cocina/productos"], publicTenant, ctrl.getCocina);
r.post(["/cocina/movimiento", "/:slug/cocina/movimiento"], publicTenant, ctrl.registrarMovCocina);
r.post("/cocina/validar-pin", ctrl.validarPin); // no toca datos, no necesita tenant
r.get(["/cocina/catalogo", "/:slug/cocina/catalogo"], publicTenant, ctrl.getCatalogoCocina);
r.post(["/cocina/activar", "/:slug/cocina/activar"], publicTenant, ctrl.activarProductoCocina);
r.post(["/cocina/desactivar", "/:slug/cocina/desactivar"], publicTenant, ctrl.desactivarProductoCocina);

module.exports = r;