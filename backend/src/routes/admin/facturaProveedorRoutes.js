// backend/src/routes/admin/facturaProveedorRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const soloAdmin = require("../../middlewares/roleMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const requierePlan = require("../../middlewares/requierePlan");
const ctrl = require("../../controllers/admin/facturaProveedorController");

r.post("/",   auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.crear);
r.get("/",    auth, tenant, requierePlan("cuentas_por_pagar"), ctrl.getAll);
r.get("/indicadores", auth, tenant, requierePlan("cuentas_por_pagar"), ctrl.getIndicadores);
r.get("/:id", auth, tenant, requierePlan("cuentas_por_pagar"), ctrl.getById);
r.post("/:id/pagos", auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.registrarPago);
r.delete("/:id", auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.eliminar);

module.exports = r;