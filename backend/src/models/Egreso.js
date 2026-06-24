// backend/src/models/Egreso.js
const { pool } = require("../config/db");

const Egreso = {
  // Registrar un egreso
  crear: async ({ caja_id, usuario_id, descripcion, monto }) => {
    const fecha = new Date().toISOString().split("T")[0];
    const hora  = new Date().toTimeString().slice(0, 8);
    const [r] = await pool.execute(
      `INSERT INTO egresos (caja_id, usuario_id, descripcion, monto, fecha, hora)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [caja_id, usuario_id, descripcion, monto, fecha, hora]
    );
    return r.insertId;
  },

  // Egresos de una caja
  getByCaja: async (caja_id) => {
    const [rows] = await pool.execute(
      `SELECT e.*, u.nombre as usuario_nombre
       FROM egresos e
       JOIN usuarios u ON u.id = e.usuario_id
       WHERE e.caja_id = ?
       ORDER BY e.creado_en`,
      [caja_id]
    );
    return rows.map(r => ({ ...r, monto: parseFloat(r.monto) }));
  },

  // Total de egresos de una caja
  getTotalByCaja: async (caja_id) => {
    const [r] = await pool.execute(
      "SELECT COALESCE(SUM(monto), 0) as total FROM egresos WHERE caja_id = ?",
      [caja_id]
    );
    return parseFloat(r[0].total) || 0;
  },
};

module.exports = Egreso;