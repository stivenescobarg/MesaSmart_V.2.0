// backend/src/models/Restaurante.js
const { pool } = require("../config/db");

// ── Categorías estándar con las que arranca todo restaurante nuevo ──
// Mismo set que ya usa el restaurante 1, para que el "Agregar producto"
// siempre tenga opciones reales de BD (nunca un fallback hardcodeado).
const CATEGORIAS_DEFAULT = [
  "Platos fuertes", "Entradas", "Platos típicos", "Pastas",
  "Cortes", "Sushi", "Comida Vegana", "Quesos", "Bar",
];

const Restaurante = {
  getById: async (id) => {
    const [r] = await pool.execute("SELECT * FROM restaurantes WHERE id=? LIMIT 1", [id]);
    return r[0] || null;
  },

  getBySlug: async (slug) => {
    const [r] = await pool.execute("SELECT * FROM restaurantes WHERE slug=? LIMIT 1", [slug]);
    return r[0] || null;
  },

  listar: async () => {
    const [rows] = await pool.execute(`
      SELECT
        r.*,
        COUNT(u.id) AS total_usuarios
      FROM restaurantes r
      LEFT JOIN usuarios u ON u.restaurante_id = r.id AND u.activo = TRUE
      GROUP BY r.id
      ORDER BY r.creado_en DESC
    `);
    return rows;
  },

  // 👇 ahora crea el restaurante Y sus categorías por defecto, en una
  // sola transacción — si algo falla, no queda un restaurante "a medias"
  // sin plantilla de categorías.
  crear: async ({ nombre, slug, plan }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [r] = await conn.execute(
        `INSERT INTO restaurantes (nombre, slug, estado, plan, activado_en)
         VALUES (?, ?, 'pendiente', ?, NULL)`,
        [nombre, slug, plan || null]
      );
      const restauranteId = r.insertId;

      for (const catNombre of CATEGORIAS_DEFAULT) {
        await conn.execute(
          `INSERT INTO categorias (nombre, restaurante_id) VALUES (?, ?)`,
          [catNombre, restauranteId]
        );
      }

      await conn.commit();
      return restauranteId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  activar: async (id) => {
    const [r] = await pool.execute(
      `UPDATE restaurantes SET estado='activo', activado_en=? WHERE id=? AND estado!='activo'`,
      [new Date(), id]
    );
    return r.affectedRows > 0;
  },

  suspender: async (id) => {
    const [r] = await pool.execute(
      `UPDATE restaurantes SET estado='suspendido' WHERE id=? AND estado='activo'`,
      [id]
    );
    return r.affectedRows > 0;
  },
};

module.exports = Restaurante;