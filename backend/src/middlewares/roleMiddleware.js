// backend/src/middlewares/roleMiddleware.js
module.exports = (rolesPermitidos) => (req, res, next) => {
  const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  if (!roles.includes(req.usuario?.rol))
    return res.status(403).json({ msg: `Acceso denegado. Se requiere: ${roles.join(" o ")}.` });
  next();
};