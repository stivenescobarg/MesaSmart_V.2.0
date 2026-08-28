// backend/src/middlewares/publicTenantMiddleware.js — nuevo archivo, completo
const Restaurante = require("../models/Restaurante");

// Para rutas PÚBLICAS (sin auth). Usa :slug de la URL si viene (preparado
// para el QR futuro); si no viene, cae al restaurante por defecto para no
// romper el frontend actual (Menu.jsx, sin cambios, sigue funcionando igual).
// TODO: quitar el fallback cuando el QR con slug real esté implementado.
module.exports = async (req, res, next) => {
  try {
    const slug = req.params.slug || process.env.DEFAULT_RESTAURANTE_SLUG;
    if (!slug) return res.status(500).json({ msg: "No hay restaurante configurado por defecto." });

    const restaurante = await Restaurante.getBySlug(slug);
    if (!restaurante) return res.status(404).json({ msg: "Restaurante no encontrado." });
    if (restaurante.estado !== "activo")
      return res.status(403).json({ msg: "Este restaurante no está disponible en este momento." });

    req.restaurante_id = restaurante.id;
    req.restaurante = restaurante;
    next();
  } catch (err) {
    console.error("[publicTenantMiddleware]", err);
    res.status(500).json({ msg: "Error al identificar el restaurante." });
  }
};