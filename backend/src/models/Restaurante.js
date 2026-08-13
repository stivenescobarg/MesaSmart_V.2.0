const { pool } = require("../config/db");

const Restaurante = {
  getById: async (id) => {
    const [r] = await pool.execute("SELECT * FROM restaurantes WHERE id=? LIMIT 1", [id]);
    return r[0] || null;
  },

  getBySlug: async (slug) => {
    const [r] = await pool.execute("SELECT * FROM restaurantes WHERE slug=? LIMIT 1", [slug]);
    return r[0] || null;
  },

  // ── Fase 4: panel super-admin ─────────────────────────────────

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

  crear: async ({ nombre, slug, plan }) => {
    const [r] = await pool.execute(
      `INSERT INTO restaurantes (nombre, slug, estado, plan, activado_en)
       VALUES (?, ?, 'pendiente', ?, NULL)`,
      [nombre, slug, plan || null]
    );
    return r.insertId;
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