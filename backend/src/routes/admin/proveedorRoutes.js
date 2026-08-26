// backend/src/routes/admin/proveedorRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const soloAdmin = require("../../middlewares/roleMiddleware"); // asumiendo firma roleMiddleware(["admin"])
const ctrl = require("../../controllers/admin/proveedorController");
const tenant = require("../../middlewares/tenantMiddleware");
const requierePlan = require("../../middlewares/requierePlan");

r.post("/",   auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.crear);
r.get("/",    auth, tenant, requierePlan("cuentas_por_pagar"), ctrl.getAll);
r.get("/:id", auth, tenant, requierePlan("cuentas_por_pagar"), ctrl.getById);
r.put("/:id", auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.actualizar);
r.patch("/:id/estado", auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.cambiarEstado);
r.delete("/:id", auth, tenant, requierePlan("cuentas_por_pagar"), soloAdmin(["admin"]), ctrl.eliminar);

module.exports = r;