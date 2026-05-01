// backend/src/routes/admin/stockRoutes.js — ACTUALIZADO
// Agrega: GET /api/stock/cocina  (sin auth, para panel cocina)
//         POST /api/stock/validar-pin (sin auth, para panel cocina)

const r    = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const role = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/admin/stockController");

// ── Rutas del admin (protegidas) ──────────────────────────────────
r.get("/",                auth, role("admin"), ctrl.getAll);
r.get("/bajo-stock",      auth, role("admin"), ctrl.getBajoStock);
r.get("/resumen",         auth, role("admin"), ctrl.getResumen);
r.post("/",               auth, role("admin"), ctrl.create);
r.patch("/:id",           auth, role("admin"), ctrl.update);
r.delete("/:id",          auth, role("admin"), ctrl.remove);
r.post("/movimientos",    auth, role("admin"), ctrl.registrarMovimiento);
r.get("/:id/movimientos", auth, role("admin"), ctrl.getMovimientos);

// ── Rutas para panel de COCINA (sin auth de admin, usan PIN) ─────
r.get("/cocina/productos",  ctrl.getCocina);          // solo productos categoría cocina
r.post("/cocina/movimiento", ctrl.registrarMovCocina); // registra con PIN
r.post("/cocina/validar-pin", ctrl.validarPin);        // valida PIN

module.exports = r;