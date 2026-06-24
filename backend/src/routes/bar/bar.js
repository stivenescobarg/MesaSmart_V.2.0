// backend/src/routes/bar/bar.js
const { Router } = require("express");
const {
  getOrdenes, marcarListo, updateEstado, toggleAnclada,
  getInventario, addProducto, updateProducto, deleteProducto, getAlertas,
  getCompras, addCompra, completarCompra,
  iniciarTurno, getTurnoActivo, cerrarTurno, getSesiones,
} = require("../../controllers/bar/barController");

const { getLock, encender, apagar } = require("../../controllers/bar/inventarioLockController");
const verifyToken = require("../../middlewares/authMiddleware");

const router = Router();

// ── Middleware: bloquea si inventario no está desbloqueado ───────────────────
async function verificarLock(req, res, next) {
  try {
    const { pool } = require("../../config/db");
    const [[row]]  = await pool.execute(
      "SELECT valor, expira_en FROM bar_config WHERE clave = 'inventario_editable'"
    );
    const ahora  = new Date();
    const expira = row?.expira_en ? new Date(row.expira_en) : null;
    const ok     = row?.valor === "1" && expira && expira > ahora;
    if (!ok) {
      return res.status(423).json({
        ok: false,
        error: "Inventario bloqueado. Pide al admin que lo desbloquee.",
        codigo: "INVENTARIO_BLOQUEADO",
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// ── Órdenes ──────────────────────────────────────────────────────────────────
router.get   ("/ordenes",                  getOrdenes);
router.patch ("/orden/:id",                marcarListo);
router.patch ("/orden/:id/estado",         updateEstado);
router.patch ("/orden/:id/anclar",         toggleAnclada);

// ── Inventario ───────────────────────────────────────────────────────────────
router.get   ("/inventario",               getInventario);
router.get   ("/inventario/alertas",       getAlertas);
router.post  ("/inventario",               verificarLock, addProducto);
router.patch ("/inventario/:id",           verificarLock, updateProducto);
router.delete("/inventario/:id",           verificarLock, deleteProducto);

// ── Lock (solo admin) ────────────────────────────────────────────────────────
router.get   ("/inventario/lock",          getLock);
router.post  ("/inventario/lock/encender", verifyToken, encender);
router.post  ("/inventario/lock/apagar",   verifyToken, apagar);

// ── Compras ───────────────────────────────────────────────────────────────────
router.get   ("/compras",                  getCompras);
router.post  ("/compras",                  verificarLock, addCompra);
router.patch ("/compras/:id/completar",    verificarLock, completarCompra);

// ── Turnos ────────────────────────────────────────────────────────────────────
router.get   ("/turno/activo",             verifyToken, getTurnoActivo);
router.post  ("/turno/iniciar",            verifyToken, iniciarTurno);
router.post  ("/turno/cerrar",             verifyToken, cerrarTurno);

// ── Sesiones (historial de turnos cerrados) ───────────────────────────────────
router.get   ("/sesiones",                 getSesiones);

module.exports = router;