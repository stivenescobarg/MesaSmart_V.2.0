// backend/src/routes/admin/sesionRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/sesionController");

r.get("/",                          auth, role("admin"), ctrl.getSesiones);
r.delete("/forzar/:usuario_id",     auth, role("admin"), ctrl.forzarLogout);
module.exports = r;