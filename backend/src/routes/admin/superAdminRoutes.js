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

module.exports = r;