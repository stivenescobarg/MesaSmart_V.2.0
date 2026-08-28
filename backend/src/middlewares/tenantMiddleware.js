// Middleware de aislamiento de datos (multi-tenant).
// Debe ir SIEMPRE después de authMiddleware en la cadena de una ruta,
// porque depende de que req.usuario ya esté poblado.
//
// Deja disponible:
//   req.restaurante_id  -> id del restaurante del usuario (null si es super_admin)
//   req.esSuperAdmin     -> true/false
//
// Los modelos y controladores de rutas "normales" (Fase 3) deben usar
// req.restaurante_id para filtrar TODAS sus queries.

module.exports = (req, res, next) => {
  if (!req.usuario) {
    // No debería pasar si authMiddleware corrió antes, pero por seguridad:
    return res.status(401).json({ msg: "No autenticado." });
  }

  const { rol, restaurante_id } = req.usuario;

  if (rol === "super_admin") {
    // El super_admin no pertenece a ningún restaurante.
    // Las rutas normales de operación (caja, ventas, mesas, etc.) NO están
    // pensadas para que el super_admin las use directamente -- para eso
    // existirá el panel de super-admin (Fase 4) con sus propias rutas.
    req.restaurante_id = null;
    req.esSuperAdmin = true;
    return next();
  }

  if (!restaurante_id) {
    // Usuario normal sin restaurante_id = dato corrupto o token viejo.
    // No dejamos pasar la request para no arriesgar una query sin filtro.
    return res.status(403).json({
      msg: "Tu cuenta no está asociada a ningún restaurante. Contacta al administrador.",
    });
  }

  req.restaurante_id = restaurante_id;
  req.esSuperAdmin = false;
  next();
};