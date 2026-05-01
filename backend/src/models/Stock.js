// backend/src/models/Stock.js
const { pool } = require("../config/db");

const Stock = {

  // ── PRODUCTOS ───────────────────────────────────────────────
  findAll: async () => {
    const [rows] = await pool.execute(
      `SELECT * FROM stock_productos
       WHERE activo = TRUE
       ORDER BY categoria ASC, nombre ASC`
    );
    return rows.map(r => ({
      ...r,
      cantidad_actual: parseFloat(r.cantidad_actual) || 0,
      cantidad_minima: parseFloat(r.cantidad_minima) || 0,
      bajo_stock: parseFloat(r.cantidad_actual) <= parseFloat(r.cantidad_minima),
    }));
  },

  findBajoStock: async () => {
    const [rows] = await pool.execute(
      `SELECT * FROM stock_productos
       WHERE activo = TRUE
         AND cantidad_actual <= cantidad_minima
       ORDER BY cantidad_actual ASC`
    );
    return rows.map(r => ({
      ...r,
      cantidad_actual: parseFloat(r.cantidad_actual) || 0,
      cantidad_minima: parseFloat(r.cantidad_minima) || 0,
      bajo_stock: true,
    }));
  },

  create: async ({ nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima }) => {
    const [r] = await pool.execute(
      `INSERT INTO stock_productos
       (nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, proveedor, categoria, unidad || "unidad",
       cantidad_actual || 0, cantidad_minima || 5]
    );
    return r.insertId;
  },

  update: async (id, { nombre, proveedor, categoria, unidad, cantidad_minima }) => {
    await pool.execute(
      `UPDATE stock_productos
       SET nombre=?, proveedor=?, categoria=?, unidad=?, cantidad_minima=?
       WHERE id=?`,
      [nombre, proveedor, categoria, unidad, cantidad_minima, id]
    );
  },

  delete: async (id) => {
    await pool.execute(
      "UPDATE stock_productos SET activo = FALSE WHERE id = ?", [id]
    );
  },

  // ── MOVIMIENTOS ─────────────────────────────────────────────
  registrarMovimiento: async ({ producto_id, usuario_id, tipo, cantidad, observacion, fecha }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Registrar el movimiento
      const [r] = await conn.execute(
        `INSERT INTO stock_movimientos
         (producto_id, usuario_id, tipo, cantidad, observacion, fecha)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [producto_id, usuario_id, tipo, cantidad,
         observacion || null,
         fecha || new Date().toISOString().split("T")[0]]
      );

      // Actualizar cantidad según tipo
      if (tipo === "ingreso") {
        await conn.execute(
          "UPDATE stock_productos SET cantidad_actual = cantidad_actual + ? WHERE id = ?",
          [cantidad, producto_id]
        );
      } else if (tipo === "egreso") {
        await conn.execute(
          "UPDATE stock_productos SET cantidad_actual = GREATEST(0, cantidad_actual - ?) WHERE id = ?",
          [cantidad, producto_id]
        );
      } else if (tipo === "ajuste") {
        // Ajuste directo a un valor absoluto
        await conn.execute(
          "UPDATE stock_productos SET cantidad_actual = ? WHERE id = ?",
          [cantidad, producto_id]
        );
      }

      await conn.commit();
      return r.insertId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  getMovimientos: async (producto_id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, u.nombre as usuario_nombre
       FROM stock_movimientos m
       JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.producto_id = ?
       ORDER BY m.creado_en DESC
       LIMIT 20`,
      [producto_id]
    );
    return rows.map(r => ({ ...r, cantidad: parseFloat(r.cantidad) || 0 }));
  },

  // Resumen para el dashboard
  getResumen: async () => {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) as total_productos,
         SUM(CASE WHEN cantidad_actual <= cantidad_minima THEN 1 ELSE 0 END) as bajo_stock,
         SUM(CASE WHEN categoria = 'cocina' THEN 1 ELSE 0 END) as total_cocina,
         SUM(CASE WHEN categoria = 'bar'    THEN 1 ELSE 0 END) as total_bar
       FROM stock_productos WHERE activo = TRUE`
    );
    return rows[0];
  },
};

module.exports = Stock;