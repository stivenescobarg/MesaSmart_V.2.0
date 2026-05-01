// backend/src/routes/admin/zonaRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/zonaController");

r.get("/",         auth, ctrl.getAll);
r.post("/",        auth, role("admin"), ctrl.create);
r.patch("/:id",    auth, role("admin"), ctrl.update);
r.delete("/:id",   auth, role("admin"), ctrl.remove);

module.exports = r;