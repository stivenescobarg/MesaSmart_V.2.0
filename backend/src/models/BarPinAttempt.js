// backend/src/models/BarPinAttempt.js
const { pool } = require("../config/db");

const BarPinAttempt = {
  async registrar({ restaurante_id, usuario_id, tipo_accion, exito, ip_address }) {
    const [result] = await pool.execute(
      `INSERT INTO bar_pin_attempts 
       (restaurante_id, usuario_id, tipo_accion, exito, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [restaurante_id, usuario_id || null, tipo_accion, exito, ip_address || null]
    );
    return result.insertId;
  },

  async obtenerIntentosFailidos(restaurante_id, usuario_id, ip_address, minutos = 15) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as cantidad FROM bar_pin_attempts 
       WHERE restaurante_id = ?
       AND exito = FALSE
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
       AND (usuario_id = ? OR ip_address = ?)
       `,
      [restaurante_id, minutos, usuario_id || null, ip_address || null]
    );
    return rows[0]?.cantidad || 0;
  },

  async obtenerHistorial(restaurante_id, usuario_id, limite = 20) {
    const [rows] = await pool.execute(
      `SELECT * FROM bar_pin_attempts 
       WHERE restaurante_id = ? AND usuario_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [restaurante_id, usuario_id, limite]
    );
    return rows;
  },
};

module.exports = BarPinAttempt;