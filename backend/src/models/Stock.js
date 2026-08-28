const { pool } = require("../config/db");

const Stock = {
  findAll: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT * FROM stock_productos WHERE activo = TRUE AND restaurante_id = ? ORDER BY categoria, nombre`,
      [restaurante_id]
    );
    return rows.map(r => ({
      ...r,
      cantidad_actual: Number(r.cantidad_actual),
      cantidad_minima: Number(r.cantidad_minima),
      bajo_stock: Number(r.cantidad_actual) <= Number(r.cantidad_minima),
    }));
  },

  findBajoStock: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT * FROM stock_productos
       WHERE activo = TRUE AND restaurante_id = ? AND cantidad_actual <= cantidad_minima
       ORDER BY cantidad_actual`,
      [restaurante_id]
    );
    return rows.map(r => ({
      ...r,
      cantidad_actual: Number(r.cantidad_actual),
      cantidad_minima: Number(r.cantidad_minima),
      bajo_stock: true,
    }));
  },

  create: async ({ restaurante_id, nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima }) => {
    const [result] = await pool.execute(
      `INSERT INTO stock_productos
       (restaurante_id, nombre, proveedor, categoria, unidad, cantidad_actual, cantidad_minima)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurante_id, nombre, proveedor, categoria, unidad || "unidad", cantidad_actual || 0, cantidad_minima || 5]
    );
    return result.insertId;
  },

  update: async (id, restaurante_id, data) => {
    const { nombre = null, proveedor = null, categoria = null, unidad = null, cantidad_minima = null } = data;
    const [r] = await pool.execute(
      `UPDATE stock_productos
       SET nombre = COALESCE(?, nombre), proveedor = COALESCE(?, proveedor),
           categoria = COALESCE(?, categoria), unidad = COALESCE(?, unidad),
           cantidad_minima = COALESCE(?, cantidad_minima)
       WHERE id = ? AND restaurante_id = ?`,
      [nombre, proveedor, categoria, unidad, cantidad_minima, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  activarCocina: async (id, restaurante_id, cantidadMinima = null) => {
    const [r] = await pool.execute(
      `UPDATE stock_productos SET categoria='cocina', cantidad_minima=COALESCE(?, cantidad_minima)
       WHERE id=? AND restaurante_id=?`,
      [cantidadMinima, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  desactivarCocina: async (id, restaurante_id) => {
    const [r] = await pool.execute(
      `UPDATE stock_productos SET categoria = 'general' WHERE id = ? AND restaurante_id = ?`,
      [id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  delete: async (id, restaurante_id) => {
    const [r] = await pool.execute(
      `UPDATE stock_productos SET activo = FALSE WHERE id = ? AND restaurante_id = ?`,
      [id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  registrarMovimiento: async ({ producto_id, restaurante_id, usuario_id, tipo, cantidad, observacion, fecha }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar que el producto sea del MISMO restaurante ANTES de mover
      // stock — evita que un movimiento afecte inventario ajeno.
      const [[prod]] = await conn.execute(
        "SELECT id FROM stock_productos WHERE id = ? AND restaurante_id = ? FOR UPDATE",
        [producto_id, restaurante_id]
      );
      if (!prod) {
        await conn.rollback();
        const err = new Error("Producto no encontrado.");
        err.status = 404;
        throw err;
      }

      const [result] = await conn.execute(
        `INSERT INTO stock_movimientos (producto_id, restaurante_id, usuario_id, tipo, cantidad, observacion, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [producto_id, restaurante_id, usuario_id, tipo, cantidad, observacion || null, fecha || new Date().toISOString().slice(0, 10)]
      );

      if (tipo === "ingreso") {
        await conn.execute("UPDATE stock_productos SET cantidad_actual = cantidad_actual + ? WHERE id=?", [cantidad, producto_id]);
      } else if (tipo === "egreso") {
        await conn.execute("UPDATE stock_productos SET cantidad_actual = GREATEST(0,cantidad_actual-?) WHERE id=?", [cantidad, producto_id]);
      } else if (tipo === "ajuste") {
        await conn.execute("UPDATE stock_productos SET cantidad_actual=? WHERE id=?", [cantidad, producto_id]);
      }

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getMovimientos: async (producto_id, restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT m.*, u.nombre AS usuario_nombre
       FROM stock_movimientos m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.producto_id = ? AND m.restaurante_id = ?
       ORDER BY m.creado_en DESC
       LIMIT 20`,
      [producto_id, restaurante_id]
    );
    return rows.map(r => ({ ...r, cantidad: Number(r.cantidad) }));
  },

  getResumen: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) total_productos,
        SUM(CASE WHEN cantidad_actual<=cantidad_minima THEN 1 ELSE 0 END) bajo_stock,
        SUM(CASE WHEN categoria='cocina' THEN 1 ELSE 0 END) total_cocina,
        SUM(CASE WHEN categoria='bar' THEN 1 ELSE 0 END) total_bar
       FROM stock_productos
       WHERE activo=TRUE AND restaurante_id = ?`,
      [restaurante_id]
    );
    return rows[0];
  },
};

Stock.getIngredientes = async (restaurante_id) => {
  const [rows] = await pool.execute(
    `SELECT id, nombre, unidad, stock FROM ingredientes WHERE restaurante_id = ? ORDER BY nombre`,
    [restaurante_id]
  );
  return rows;
};

module.exports = Stock;