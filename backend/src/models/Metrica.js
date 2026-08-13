const { pool } = require("../config/db");

const Metrica = {
  getResumenDia: async (caja_id) => {
    const [ventas] = await pool.execute(
      `SELECT
         COALESCE(SUM(total), 0) as total_vendido,
         COALESCE(SUM(CASE WHEN metodo_pago='efectivo'      THEN total ELSE 0 END), 0) as efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago='tarjeta'       THEN total ELSE 0 END), 0) as tarjeta,
         COALESCE(SUM(CASE WHEN metodo_pago='transferencia' THEN total ELSE 0 END), 0) as transferencia,
         COUNT(*) as cantidad_ventas
       FROM ventas
       WHERE caja_id = ?`,
      [caja_id]
    );

    const [egresos] = await pool.execute(
      "SELECT COALESCE(SUM(monto), 0) as total_egresos FROM egresos WHERE caja_id = ?",
      [caja_id]
    );

    // ⚠️ PENDIENTE (próximo módulo recomendado: "mesas"): esta consulta cuenta mesas
    // de TODOS los restaurantes porque "mesas" todavía no tiene restaurante_id.
    const [mesas] = await pool.execute(
      `SELECT
         SUM(CASE WHEN estado = 'ocupada' THEN 1 ELSE 0 END) as ocupadas,
         SUM(CASE WHEN estado = 'libre'   THEN 1 ELSE 0 END) as libres,
         COUNT(*) as total
       FROM mesas WHERE activa = TRUE`
    );

    const [productos] = await pool.execute(
      `SELECT dv.nombre, SUM(dv.cantidad) as total_vendido
       FROM detalle_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.caja_id = ?
       GROUP BY dv.nombre
       ORDER BY total_vendido DESC
       LIMIT 1`,
      [caja_id]
    );

    const v  = ventas[0];
    const tv = parseFloat(v.total_vendido) || 0;
    const ef = parseFloat(v.efectivo)      || 0;
    const te = parseFloat(egresos[0].total_egresos) || 0;

    return {
      total_vendido:   tv,
      efectivo:        ef,
      tarjeta:         parseFloat(v.tarjeta)        || 0,
      transferencia:   parseFloat(v.transferencia)  || 0,
      cantidad_ventas: parseInt(v.cantidad_ventas)  || 0,
      total_egresos:   te,
      efectivo_neto:   ef - te,
      mesas: {
        ocupadas: parseInt(mesas[0].ocupadas) || 0,
        libres:   parseInt(mesas[0].libres)   || 0,
        total:    parseInt(mesas[0].total)    || 0,
      },
      producto_estrella: productos[0]
        ? { nombre: productos[0].nombre, cantidad: parseInt(productos[0].total_vendido) }
        : null,
    };
  },

  getVentasPorDia: async (restaurante_id) => {
    const [rows] = await pool.execute(
      `SELECT
         DATE_FORMAT(fecha, '%d/%m') as dia,
         fecha,
         COALESCE(SUM(total), 0) as total
       FROM ventas
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND restaurante_id = ?
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [restaurante_id]
    );
    return rows.map(r => ({ ...r, total: parseFloat(r.total) || 0 }));
  },

  getVentasPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as cantidad
       FROM ventas WHERE restaurante_id = ? AND fecha >= ? AND fecha <= ?`,
      [restaurante_id, fecha_desde, fecha_hasta]
    );
    return {
      total:    parseFloat(rows[0].total) || 0,
      cantidad: parseInt(rows[0].cantidad) || 0,
    };
  },

  getMetodosPagoPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    const [rows] = await pool.execute(
      `SELECT metodo_pago as metodo,
              COALESCE(SUM(total), 0) as total,
              COUNT(*) as cantidad
       FROM ventas
       WHERE restaurante_id = ? AND fecha >= ? AND fecha <= ?
       GROUP BY metodo_pago`,
      [restaurante_id, fecha_desde, fecha_hasta]
    );
    return rows.map(r => ({ ...r, total: parseFloat(r.total) || 0 }));
  },

  getProductoEstrellaPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    const [rows] = await pool.execute(
      `SELECT dv.nombre, SUM(dv.cantidad) as total_vendido
       FROM detalle_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.restaurante_id = ? AND v.fecha >= ? AND v.fecha <= ?
       GROUP BY dv.nombre
       ORDER BY total_vendido DESC
       LIMIT 1`,
      [restaurante_id, fecha_desde, fecha_hasta]
    );
    return rows[0] ? { nombre: rows[0].nombre, cantidad: parseInt(rows[0].total_vendido) } : null;
  },

  getMetodosPago: async (caja_id) => {
    const [rows] = await pool.execute(
      `SELECT metodo_pago as metodo,
              COALESCE(SUM(total), 0) as total,
              COUNT(*) as cantidad
       FROM ventas
       WHERE caja_id = ?
       GROUP BY metodo_pago`,
      [caja_id]
    );
    return rows.map(r => ({ ...r, total: parseFloat(r.total) || 0 }));
  },
};

module.exports = Metrica;