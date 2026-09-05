const r      = require("express").Router();
const auth   = require("../../middlewares/authMiddleware");
const role   = require("../../middlewares/roleMiddleware");
const tenant = require("../../middlewares/tenantMiddleware");
const ctrl   = require("../../controllers/admin/sesionController");

r.get("/",                      auth, tenant, role("admin"), ctrl.getSesiones);
r.delete("/forzar/:usuario_id", auth, tenant, role("admin"), ctrl.forzarLogout);

module.exports = r;