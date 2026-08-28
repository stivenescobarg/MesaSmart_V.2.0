// Middleware que permite el paso ÚNICAMENTE al super_admin.
// Va después de authMiddleware (necesita req.usuario ya poblado).
// NO usa tenantMiddleware — el super_admin no tiene restaurante_id,
// y las rutas de super-admin no deben filtrarse por tenant.
module.exports = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ msg: "No autenticado." });
  }
  if (req.usuario.rol !== "super_admin") {
    return res.status(403).json({ msg: "Acceso denegado. Se requiere rol super_admin." });
  }
  next();
};