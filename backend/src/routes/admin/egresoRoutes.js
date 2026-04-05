// backend/src/routes/admin/egresoRoutes.js
const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/admin/egresoController");

r.post("/",   auth, ctrl.crear);
r.get("/",    auth, ctrl.getByCajaActual);
module.exports = r;