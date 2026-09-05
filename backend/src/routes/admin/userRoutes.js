const r      = require("express").Router();
const auth   = require("../../middlewares/authMiddleware");
const role   = require("../../middlewares/roleMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const ctrl   = require("../../controllers/admin/userController");

r.get("/sesiones", auth, tenant, role("admin"), ctrl.getSesiones);
r.get("/",         auth, tenant, role("admin"), ctrl.getAll);
r.post("/",        auth, tenant, role("admin"), ctrl.create);
r.delete("/:id",   auth, tenant, role("admin"), ctrl.remove);

module.exports = r;