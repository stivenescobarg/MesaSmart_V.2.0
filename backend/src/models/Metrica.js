// backend/src/models/Metrica.js
const { pool } = require("../config/db");

const Metrica = {
  // ── MÉTRICAS DEL DÍA ACTUAL ──────────────────────────────────
  getResumenDia: async (caja_id) => {
    // Ventas del día
    const [ventas] = await pool.execute(
      `SELECT
         COALESCE(SUM(total), 0)                                              as total_vendido,
         COALESCE(SUM(CASE WHEN metodo_pago='efectivo'      THEN total ELSE 0 END), 0) as efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago='tarjeta'       THEN total ELSE 0 END), 0) as tarjeta,
         COALESCE(SUM(CASE WHEN metodo_pago='transferencia' THEN total ELSE 0 END), 0) as transferencia,
         COUNT(*) as cantidad_ventas
       FROM ventas
       WHERE caja_id = ?`,
      [caja_id]
    );

    // Egresos del día
    const [egresos] = await pool.execute(
      "SELECT COALESCE(SUM(monto), 0) as total_egresos FROM egresos WHERE caja_id = ?",
      [caja_id]
    );

    // Mesas ocupadas vs libres
    const [mesas] = await pool.execute(
      `SELECT
         SUM(CASE WHEN estado = 'ocupada' THEN 1 ELSE 0 END) as ocupadas,
         SUM(CASE WHEN estado = 'libre'   THEN 1 ELSE 0 END) as libres,
         COUNT(*) as total
       FROM mesas WHERE activa = TRUE`
    );

    // Producto más vendido del día
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
      efectivo_neto:   ef - te,  // efectivo real en caja
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

  // ── VENTAS POR DÍA (últimos 7 días) ─────────────────────────
  getVentasPorDia: async () => {
    const [rows] = await pool.execute(
      `SELECT
         DATE_FORMAT(fecha, '%d/%m') as dia,
         fecha,
         COALESCE(SUM(total), 0) as total
       FROM ventas
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY fecha
       ORDER BY fecha ASC`
    );
    return rows.map(r => ({ ...r, total: parseFloat(r.total) || 0 }));
  },

  // ── VENTAS POR MÉTODO (caja actual) ──────────────────────────
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