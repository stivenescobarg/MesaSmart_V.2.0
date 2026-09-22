// backend/src/middlewares/publicTenantMiddleware.js
const Restaurante = require("../models/Restaurante");
const { pool } = require("../config/db");

// Para rutas PÚBLICAS (sin auth).
// Orden de resolución del restaurante:
//   1. :slug en la URL (QR con slug real, cuando el frontend lo mande)
//   2. restaurante_id en body o query (lo que el frontend YA envía hoy)
//   3. DEFAULT_RESTAURANTE_SLUG como último recurso, si existe
module.exports = async (req, res, next) => {
  try {
      const slug = req.params.slug;
    const restauranteIdRaw =
      req.params.restauranteId || req.body?.restaurante_id || req.query?.restaurante_id;
    const restauranteId = Number(restauranteIdRaw);

    let restaurante = null;

    if (slug) {
      restaurante = await Restaurante.getBySlug(slug);
    } else if (restauranteIdRaw && Number.isFinite(restauranteId)) {
      const [rows] = await pool.execute(
        `SELECT id, nombre, slug, estado FROM restaurantes WHERE id = ?`,
        [restauranteId]
      );
      restaurante = rows[0] || null;
    } else if (process.env.DEFAULT_RESTAURANTE_SLUG) {
      restaurante = await Restaurante.getBySlug(process.env.DEFAULT_RESTAURANTE_SLUG);
    }

    if (!restaurante) {
      return res.status(404).json({ msg: "Restaurante no encontrado." });
    }
    if (restaurante.estado !== "activo") {
      return res.status(403).json({ msg: "Este restaurante no está disponible en este momento." });
    }

    req.restaurante_id = restaurante.id;
    req.restaurante = restaurante;
    next();
  } catch (err) {
    console.error("[publicTenantMiddleware]", err);
    res.status(500).json({ msg: "Error al identificar el restaurante." });
  }
};