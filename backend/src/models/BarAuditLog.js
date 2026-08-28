// backend/src/models/BarAuditLog.js
const { pool } = require("../config/db");

const BarAuditLog = {
  async crear({
    restaurante_id,
    accion,
    producto_id,
    orden_id,
    cantidad_antes,
    cantidad_despues,
    cambio,
    usuario_id,
    usuario_nombre,
    descripcion,
    ip_address,
  }, conn = pool) {   // ← nuevo: si no se pasa conn, usa el pool normal (fuera de transacción)
    const [result] = await conn.execute(
      `INSERT INTO bar_audit_logs 
       (restaurante_id, accion, producto_id, orden_id, cantidad_antes, cantidad_despues, cambio, usuario_id, usuario_nombre, descripcion, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        restaurante_id,
        accion,
        producto_id || null,
        orden_id || null,
        cantidad_antes || null,
        cantidad_despues || null,
        cambio || null,
        usuario_id || null,
        usuario_nombre || null,
        descripcion || null,
        ip_address || null,
      ]
    );
    return result.insertId;
  },

  async obtenerPorOrden(restaurante_id, orden_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM bar_audit_logs 
       WHERE restaurante_id = ? AND orden_id = ? 
       ORDER BY timestamp DESC`,
      [restaurante_id, orden_id]
    );
    return rows;
  },

  async obtenerPorProducto(restaurante_id, producto_id, dias = 7) {
    const [rows] = await pool.execute(
      `SELECT * FROM bar_audit_logs 
       WHERE restaurante_id = ? AND producto_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY timestamp DESC
       LIMIT 50`,
      [restaurante_id, producto_id, dias]
    );
    return rows;
  },

  async obtenerPorFecha(restaurante_id, fecha_inicio, fecha_fin) {
    const [rows] = await pool.execute(
      `SELECT * FROM bar_audit_logs 
       WHERE restaurante_id = ?
       AND DATE(timestamp) BETWEEN ? AND ?
       ORDER BY timestamp DESC
       LIMIT 100`,
      [restaurante_id, fecha_inicio, fecha_fin]
    );
    return rows;
  },
};

module.exports = BarAuditLog;