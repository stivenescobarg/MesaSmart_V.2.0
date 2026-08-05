const { pool } = require("../config/db");

const Stock = {

  // ==========================
  // PRODUCTOS
  // ==========================

  findAll: async () => {
    const [rows] = await pool.execute(`
      SELECT *
      FROM stock_productos
      WHERE activo = TRUE
      ORDER BY categoria, nombre
    `);

    return rows.map(r => ({
      ...r,
      cantidad_actual: Number(r.cantidad_actual),
      cantidad_minima: Number(r.cantidad_minima),
      bajo_stock:
        Number(r.cantidad_actual) <= Number(r.cantidad_minima),
    }));
  },

  findBajoStock: async () => {
    const [rows] = await pool.execute(`
      SELECT *
      FROM stock_productos
      WHERE activo = TRUE
      AND cantidad_actual <= cantidad_minima
      ORDER BY cantidad_actual
    `);

    return rows.map(r => ({
      ...r,
      cantidad_actual: Number(r.cantidad_actual),
      cantidad_minima: Number(r.cantidad_minima),
      bajo_stock: true,
    }));
  },

  create: async ({
    nombre,
    proveedor,
    categoria,
    unidad,
    cantidad_actual,
    cantidad_minima,
  }) => {

    const [result] = await pool.execute(
      `
      INSERT INTO stock_productos
      (
        nombre,
        proveedor,
        categoria,
        unidad,
        cantidad_actual,
        cantidad_minima
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        proveedor,
        categoria,
        unidad || "unidad",
        cantidad_actual || 0,
        cantidad_minima || 5,
      ]
    );

    return result.insertId;
  },

  // ===================================
  // UPDATE GENERAL (NO ROMPE SI FALTAN CAMPOS)
  // ===================================

  update: async (id, data) => {

    const {
      nombre = null,
      proveedor = null,
      categoria = null,
      unidad = null,
      cantidad_minima = null,
    } = data;

    await pool.execute(
      `
      UPDATE stock_productos
      SET
        nombre = COALESCE(?, nombre),
        proveedor = COALESCE(?, proveedor),
        categoria = COALESCE(?, categoria),
        unidad = COALESCE(?, unidad),
        cantidad_minima = COALESCE(?, cantidad_minima)
      WHERE id = ?
      `,
      [
        nombre,
        proveedor,
        categoria,
        unidad,
        cantidad_minima,
        id,
      ]
    );
  },

  // ===================================
  // ACTIVAR PRODUCTO PARA COCINA
  // ===================================

  activarCocina: async (id, cantidadMinima = null) => {

    await pool.execute(
      `
      UPDATE stock_productos
      SET
        categoria='cocina',
        cantidad_minima=COALESCE(?, cantidad_minima)
      WHERE id=?
      `,
      [
        cantidadMinima,
        id,
      ]
    );

  },

  desactivarCocina: async (id) => {

  await pool.execute(
    `
    UPDATE stock_productos
    SET categoria = 'general'
    WHERE id = ?
    `,
    [id]
  );

},

  delete: async (id) => {
    await pool.execute(
      `
      UPDATE stock_productos
      SET activo = FALSE
      WHERE id = ?
      `,
      [id]
    );
  },

  // ==========================
  // MOVIMIENTOS
  // ==========================

  registrarMovimiento: async ({
    producto_id,
    usuario_id,
    tipo,
    cantidad,
    observacion,
    fecha,
  }) => {

    const conn = await pool.getConnection();

    try {

      await conn.beginTransaction();

      const [result] = await conn.execute(
        `
        INSERT INTO stock_movimientos
        (
          producto_id,
          usuario_id,
          tipo,
          cantidad,
          observacion,
          fecha
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          producto_id,
          usuario_id,
          tipo,
          cantidad,
          observacion || null,
          fecha || new Date().toISOString().slice(0,10),
        ]
      );

      if (tipo === "ingreso") {

        await conn.execute(
          `
          UPDATE stock_productos
          SET cantidad_actual = cantidad_actual + ?
          WHERE id=?
          `,
          [cantidad, producto_id]
        );

      } else if (tipo === "egreso") {

        await conn.execute(
          `
          UPDATE stock_productos
          SET cantidad_actual =
          GREATEST(0,cantidad_actual-?)
          WHERE id=?
          `,
          [cantidad, producto_id]
        );

      } else if (tipo === "ajuste") {

        await conn.execute(
          `
          UPDATE stock_productos
          SET cantidad_actual=?
          WHERE id=?
          `,
          [cantidad, producto_id]
        );

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

  getMovimientos: async (producto_id) => {

    const [rows] = await pool.execute(
      `
      SELECT
      m.*,
      u.nombre AS usuario_nombre
      FROM stock_movimientos m
      LEFT JOIN usuarios u
      ON u.id=m.usuario_id
      WHERE m.producto_id=?
      ORDER BY m.creado_en DESC
      LIMIT 20
      `,
      [producto_id]
    );

    return rows.map(r => ({
      ...r,
      cantidad: Number(r.cantidad),
    }));

  },

  // ==========================
  // RESUMEN
  // ==========================

  getResumen: async () => {

    const [rows] = await pool.execute(
      `
      SELECT

      COUNT(*) total_productos,

      SUM(
      CASE
      WHEN cantidad_actual<=cantidad_minima
      THEN 1 ELSE 0
      END
      ) bajo_stock,

      SUM(
      CASE
      WHEN categoria='cocina'
      THEN 1 ELSE 0
      END
      ) total_cocina,

      SUM(
      CASE
      WHEN categoria='bar'
      THEN 1 ELSE 0
      END
      ) total_bar

      FROM stock_productos

      WHERE activo=TRUE
      `
    );

    return rows[0];

  }

};

Stock.getIngredientes = async () => {

  const [rows] = await pool.execute(`
    SELECT
      id,
      nombre,
      unidad,
      stock
    FROM ingredientes
    ORDER BY nombre
  `);

  return rows;

};

module.exports = Stock;