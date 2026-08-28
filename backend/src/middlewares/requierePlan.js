// backend/src/middlewares/requierePlan.js
const { pool } = require("../config/db");
const { PLANES } = require("../config/planes");

const cache = new Map(); // restaurante_id -> { plan, estado, expira }
const TTL_MS = 30_000;

async function obtenerInfoRestaurante(restaurante_id) {
  const cacheado = cache.get(restaurante_id);
  if (cacheado && cacheado.expira > Date.now()) return cacheado;

  const [rows] = await pool.execute(
    "SELECT plan, estado FROM restaurantes WHERE id = ? LIMIT 1",
    [restaurante_id]
  );
  if (!rows.length) return null;

  const info = { plan: rows[0].plan, estado: rows[0].estado, expira: Date.now() + TTL_MS };
  cache.set(restaurante_id, info);
  return info;
}

// Llamar esto desde activarRestaurante / suspenderRestaurante / futuro cambiarPlan
// para que el cambio de plan o estado se refleje de inmediato, sin esperar el TTL.
function invalidarCache(restaurante_id) {
  cache.delete(restaurante_id);
}

// ── Middleware: bloquea la ruta completa con 403 si el plan no alcanza ──
// Uso: router.get("/gastos", auth, tenant, requierePlan("gastos"), ctrl.listar)
function requierePlan(feature) {
  return async (req, res, next) => {
    try {
      if (req.esSuperAdmin) return next(); // no aplica dentro del panel de super-admin

      if (!req.restaurante_id) {
        return res.status(403).json({ msg: "Cuenta sin restaurante asociado." });
      }

      const info = await obtenerInfoRestaurante(req.restaurante_id);
      if (!info) {
        return res.status(404).json({ msg: "Restaurante no encontrado." });
      }

      if (info.estado !== "activo") {
        return res.status(403).json({ msg: "El servicio de este restaurante no está activo." });
      }

      const definicion = PLANES[info.plan];
      if (!definicion || !definicion.features.has(feature)) {
        return res.status(403).json({
          msg: "Esta función requiere el plan Completo.",
          codigo: "PLAN_INSUFICIENTE",
          feature,
          plan_actual: info.plan,
        });
      }

      req.plan = info.plan;
      next();
    } catch (err) {
      console.error("[requierePlan]", err);
      res.status(500).json({ msg: "Error al verificar el plan del restaurante." });
    }
  };
}

// ── Helper de consulta: NO bloquea nada, solo responde true/false ──
// Úsalo dentro de un controller cuyo endpoint es de acceso libre (ej. Básico
// puede entrar), pero que tiene UNA parte opcional exclusiva de un plan
// superior (ej. cerrar caja es de todos, pero el PDF automático es solo
// de Completo).
// Uso: const puede = await tieneFeature(req.restaurante_id, "reporte_pdf_diario");
async function tieneFeature(restaurante_id, feature) {
  if (!restaurante_id) return false;
  const info = await obtenerInfoRestaurante(restaurante_id);
  if (!info || info.estado !== "activo") return false;
  const definicion = PLANES[info.plan];
  return !!(definicion && definicion.features.has(feature));
}

module.exports = requierePlan;
module.exports.invalidarCache = invalidarCache;
module.exports.tieneFeature = tieneFeature;