const jwt = require("jsonwebtoken");
const { verificarToken } = require("../utils/qrToken");

function extraerAdminOpcional(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return payload?.rol === "admin" ? payload : null;
  } catch {
    return null;
  }
}

// Montar SIEMPRE después de publicTenantMiddleware (necesita req.restaurante_id).
module.exports = function requiereTokenQR(req, res, next) {
  const restauranteId = req.restaurante_id;

  const admin = extraerAdminOpcional(req);
  if (admin && String(admin.restaurante_id) === String(restauranteId)) {
    req.usuario = admin;
    return next();
  }

  const mesaId = Number(req.body?.mesa_id ?? req.query?.mesa_id ?? req.params?.mesaId);
  if (!mesaId || !Number.isFinite(mesaId)) {
    return res.status(400).json({ msg: "mesa_id requerido." });
  }

  const token = req.query?.t || req.body?.t;
  if (!verificarToken(restauranteId, mesaId, token)) {
    return res.status(403).json({ msg: "Acceso no autorizado a esta mesa." });
  }

  req.mesa_id_qr = mesaId;
  next();
};