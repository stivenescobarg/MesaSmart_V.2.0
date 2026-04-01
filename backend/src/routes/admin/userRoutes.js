// backend/src/routes/admin/userRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/userController");

r.get("/",         auth, role("admin"), ctrl.getAll);
r.post("/",        auth, role("admin"), ctrl.create);
r.delete("/:id",   auth, role("admin"), ctrl.remove);
r.get("/sesiones", auth, role("admin"), ctrl.getSesiones);
module.exports = r;