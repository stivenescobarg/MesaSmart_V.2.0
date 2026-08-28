// backend/src/models/Zona.js
const { pool } = require("../config/db");

const Zona = {
  findAll: async (restaurante_id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM zonas WHERE activa = TRUE AND restaurante_id = ? ORDER BY orden ASC",
      [restaurante_id]
    );
    return rows;
  },

  findById: async (id, restaurante_id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM zonas WHERE id = ? AND restaurante_id = ? AND activa = TRUE LIMIT 1",
      [id, restaurante_id]
    );
    return rows[0] || null;
  },

  create: async ({ restaurante_id, nombre, color, orden }) => {
    const [r] = await pool.execute(
      "INSERT INTO zonas (restaurante_id, nombre, color, orden) VALUES (?, ?, ?, ?)",
      [restaurante_id, nombre, color || "#f59e0b", orden || 0]
    );
    return r.insertId;
  },

  update: async (id, restaurante_id, { nombre, color, orden }) => {
    const [r] = await pool.execute(
      "UPDATE zonas SET nombre=?, color=?, orden=? WHERE id=? AND restaurante_id=?",
      [nombre, color, orden, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  delete: async (id, restaurante_id) => {
    await pool.execute(
      "UPDATE mesas SET zona_id = NULL WHERE zona_id = ? AND restaurante_id = ?",
      [id, restaurante_id]
    );
    const [r] = await pool.execute(
      "UPDATE zonas SET activa = FALSE WHERE id = ? AND restaurante_id = ?",
      [id, restaurante_id]
    );
    return r.affectedRows > 0;
  },
};

module.exports = Zona;