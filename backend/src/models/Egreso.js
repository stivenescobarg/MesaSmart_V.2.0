// backend/src/models/Egreso.js
const { pool } = require("../config/db");

const Egreso = {
  crear: async ({ caja_id, restaurante_id, usuario_id, descripcion, categoria, monto }) => {
    const fecha = new Date().toISOString().split("T")[0];
    const hora  = new Date().toISOString().split("T")[1].slice(0, 8); // 👈 de paso, mismo fix de consistencia UTC que vimos en Venta.registrar
    const [r] = await pool.execute(
      `INSERT INTO egresos (caja_id, restaurante_id, usuario_id, descripcion, categoria, monto, fecha, hora)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [caja_id, restaurante_id, usuario_id, descripcion, categoria || "Otros", monto, fecha, hora]
    );
    return r.insertId;
  },

  // Egresos de una caja específica (uso existente: pantalla de Caja abierta)
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

  // ── NUEVO: historial por rango de fechas, independiente de la caja actual ──
  // Para el módulo de "Control de Gastos" que necesita ver gastos históricos,
  // no solo los de la caja abierta hoy.
 getByRangoFecha: async ({ restaurante_id, fecha_desde, fecha_hasta, categoria }) => {
    let sql = `
      SELECT e.*, u.nombre as usuario_nombre
      FROM egresos e
      JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.restaurante_id = ?
    `;
    const params = [restaurante_id];
    if (fecha_desde) { sql += " AND e.fecha >= ?"; params.push(fecha_desde); }
    if (fecha_hasta) { sql += " AND e.fecha <= ?"; params.push(fecha_hasta); }
    if (categoria)   { sql += " AND e.categoria = ?"; params.push(categoria); }
    sql += " ORDER BY e.fecha DESC, e.hora DESC";
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => ({ ...r, monto: parseFloat(r.monto) }));
  },

  // ── NUEVO: total agrupado por categoría, para el gráfico de pastel ──
   getTotalPorCategoria: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    let sql = `SELECT categoria, COALESCE(SUM(monto), 0) as total, COUNT(*) as cantidad
               FROM egresos WHERE restaurante_id = ?`;
    const params = [restaurante_id];
    if (fecha_desde) { sql += " AND fecha >= ?"; params.push(fecha_desde); }
    if (fecha_hasta) { sql += " AND fecha <= ?"; params.push(fecha_hasta); }
    sql += " GROUP BY categoria ORDER BY total DESC";
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => ({ categoria: r.categoria, total: parseFloat(r.total), cantidad: r.cantidad }));
  },

  getTotalPorDia: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    let sql = `SELECT fecha, COALESCE(SUM(monto), 0) as total
               FROM egresos WHERE restaurante_id = ?`;
    const params = [restaurante_id];
    if (fecha_desde) { sql += " AND fecha >= ?"; params.push(fecha_desde); }
    if (fecha_hasta) { sql += " AND fecha <= ?"; params.push(fecha_hasta); }
    sql += " GROUP BY fecha ORDER BY fecha ASC";
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => ({ fecha: r.fecha, total: parseFloat(r.total) }));
  },

  getTotalPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(monto), 0) as total, COUNT(*) as cantidad
       FROM egresos WHERE restaurante_id = ? AND fecha >= ? AND fecha <= ?`,
      [restaurante_id, fecha_desde, fecha_hasta]
    );
    return { total: parseFloat(rows[0].total) || 0, cantidad: parseInt(rows[0].cantidad) || 0 };
  },

  // backend/src/models/Egreso.js  (agregar este método)
getAllPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
  const [rows] = await pool.execute(
    `SELECT e.*, u.nombre AS usuario_nombre
     FROM egresos e
     JOIN usuarios u ON u.id = e.usuario_id
     WHERE e.restaurante_id = ? AND e.fecha BETWEEN ? AND ?
     ORDER BY e.fecha DESC, e.hora DESC`,
    [restaurante_id, fecha_desde, fecha_hasta]
  );
  return rows.map(r => ({ ...r, monto: parseFloat(r.monto) }));
},

};

module.exports = Egreso;