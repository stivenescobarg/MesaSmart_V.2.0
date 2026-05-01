// backend/src/models/Zona.js
const { pool } = require("../config/db");

const Zona = {
  findAll: async () => {
    const [rows] = await pool.execute(
      "SELECT * FROM zonas WHERE activa = TRUE ORDER BY orden ASC"
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM zonas WHERE id = ? AND activa = TRUE LIMIT 1", [id]
    );
    return rows[0] || null;
  },

  create: async ({ nombre, color, orden }) => {
    const [r] = await pool.execute(
      "INSERT INTO zonas (nombre, color, orden) VALUES (?, ?, ?)",
      [nombre, color || "#f59e0b", orden || 0]
    );
    return r.insertId;
  },

  update: async (id, { nombre, color, orden }) => {
    await pool.execute(
      "UPDATE zonas SET nombre=?, color=?, orden=? WHERE id=?",
      [nombre, color, orden, id]
    );
  },

  delete: async (id) => {
    // Desasociar mesas antes de eliminar la zona
    await pool.execute("UPDATE mesas SET zona_id = NULL WHERE zona_id = ?", [id]);
    await pool.execute("UPDATE zonas SET activa = FALSE WHERE id = ?", [id]);
  },
};

module.exports = Zona;