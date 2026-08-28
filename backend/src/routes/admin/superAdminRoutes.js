const r            = require("express").Router();
const auth         = require("../../middlewares/authMiddleware");
const soloSuperAdmin = require("../../middlewares/soloSuperAdmin");
const ctrl         = require("../../controllers/admin/superAdminController");

// Todas las rutas de este archivo llevan auth + soloSuperAdmin.
// No llevan tenantMiddleware — el super_admin opera fuera de cualquier tenant.

r.get("/restaurantes",                   auth, soloSuperAdmin, ctrl.listarRestaurantes);
r.post("/restaurantes",                  auth, soloSuperAdmin, ctrl.crearRestaurante);
r.patch("/restaurantes/:id/activar",     auth, soloSuperAdmin, ctrl.activarRestaurante);
r.patch("/restaurantes/:id/suspender",   auth, soloSuperAdmin, ctrl.suspenderRestaurante);
r.patch("/restaurantes/:id/plan",        auth, soloSuperAdmin, ctrl.cambiarPlan);

// OJO con el orden: esta ruta va ANTES de "/restaurantes/:id" — si no,
// Express interpretaría "exportar-excel" como si fuera el :id.
r.get("/restaurantes/exportar-excel",    auth, soloSuperAdmin, ctrl.exportarExcel);

// Vista de detalle: info del restaurante + admin + estado/historial de pagos
r.get("/restaurantes/:id",               auth, soloSuperAdmin, ctrl.getDetalleRestaurante);

// Registrar un pago de suscripción manual
r.post("/restaurantes/:id/pagos",        auth, soloSuperAdmin, ctrl.registrarPagoSuscripcion);

module.exports = r;