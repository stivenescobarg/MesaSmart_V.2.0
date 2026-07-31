// backend/src/models/FacturaProveedor.js
const { pool } = require("../config/db");

// Recalcula el estado de una factura según lo pagado vs el total
const calcularEstado = (valorTotal, valorPagado) => {
  if (valorPagado <= 0) return "pendiente";
  if (valorPagado >= valorTotal) return "pagada";
  return "parcial";
};

const FacturaProveedor = {
  // Crear factura (cuenta por pagar)
  crear: async ({ numero, proveedor_id, usuario_id, fecha, fecha_venc, valor_total, observaciones }) => {
    const [r] = await pool.execute(
      `INSERT INTO facturas_proveedor
         (numero, proveedor_id, usuario_id, fecha, fecha_venc, valor_total, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [numero, proveedor_id, usuario_id, fecha, fecha_venc, valor_total, observaciones || null]
    );
    return r.insertId;
  },

  // Listar con filtros: proveedor_id, estado, fecha_desde, fecha_hasta, vencidas, proximas_a_vencer
  getAll: async ({ proveedor_id, estado, fecha_desde, fecha_hasta, vencidas, proximas } = {}) => {
    let sql = `
      SELECT f.*, p.nombre AS proveedor_nombre,
             (f.valor_total - f.valor_pagado) AS valor_pendiente
      FROM facturas_proveedor f
      JOIN proveedores p ON p.id = f.proveedor_id
      WHERE 1=1
    `;
    const params = [];

    if (proveedor_id) { sql += " AND f.proveedor_id = ?"; params.push(proveedor_id); }
    if (estado)       { sql += " AND f.estado = ?";       params.push(estado); }
    if (fecha_desde)  { sql += " AND f.fecha >= ?";       params.push(fecha_desde); }
    if (fecha_hasta)  { sql += " AND f.fecha <= ?";       params.push(fecha_hasta); }

    if (vencidas) {
      sql += " AND f.estado != 'pagada' AND f.fecha_venc < CURDATE()";
    }
    if (proximas) {
      // Próximas a vencer: dentro de los siguientes 7 días, no vencidas aún
      sql += " AND f.estado != 'pagada' AND f.fecha_venc BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
    }

    sql += " ORDER BY f.fecha_venc ASC";
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => ({
      ...r,
      valor_total:     parseFloat(r.valor_total),
      valor_pagado:    parseFloat(r.valor_pagado),
      valor_pendiente: parseFloat(r.valor_pendiente),
    }));
  },

  getById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT f.*, p.nombre AS proveedor_nombre,
              (f.valor_total - f.valor_pagado) AS valor_pendiente
       FROM facturas_proveedor f
       JOIN proveedores p ON p.id = f.proveedor_id
       WHERE f.id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      valor_total:     parseFloat(rows[0].valor_total),
      valor_pagado:    parseFloat(rows[0].valor_pagado),
      valor_pendiente: parseFloat(rows[0].valor_pendiente),
    };
  },

  // Historial de pagos/abonos de una factura
  getPagos: async (factura_id) => {
    const [rows] = await pool.execute(
      `SELECT pf.*, u.nombre AS usuario_nombre
       FROM pagos_factura pf
       JOIN usuarios u ON u.id = pf.usuario_id
       WHERE pf.factura_id = ?
       ORDER BY pf.creado_en DESC`,
      [factura_id]
    );
    return rows.map(r => ({ ...r, monto: parseFloat(r.monto) }));
  },

  // Registrar un abono/pago — usa transacción para mantener factura y pago sincronizados
  registrarPago: async ({ factura_id, usuario_id, monto, metodo_pago, observaciones, fecha }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [facturaRows] = await conn.execute(
        "SELECT valor_total, valor_pagado FROM facturas_proveedor WHERE id = ? FOR UPDATE",
        [factura_id]
      );
      if (!facturaRows[0]) throw new Error("Factura no encontrada.");

      const valorTotal      = parseFloat(facturaRows[0].valor_total);
      const valorPagadoAnt  = parseFloat(facturaRows[0].valor_pagado);
      const nuevoValorPagado = valorPagadoAnt + parseFloat(monto);

      if (nuevoValorPagado > valorTotal + 0.01) {
        throw new Error("El monto excede el valor pendiente de la factura.");
      }

      const nuevoEstado = calcularEstado(valorTotal, nuevoValorPagado);

      await conn.execute(
        `INSERT INTO pagos_factura (factura_id, usuario_id, monto, metodo_pago, observaciones, fecha)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [factura_id, usuario_id, monto, metodo_pago, observaciones || null, fecha]
      );

      await conn.execute(
        "UPDATE facturas_proveedor SET valor_pagado = ?, estado = ? WHERE id = ?",
        [nuevoValorPagado, nuevoEstado, factura_id]
      );

      await conn.commit();
      return { nuevoValorPagado, nuevoEstado };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Indicadores para el dashboard de cuentas por pagar
  getIndicadores: async () => {
    const [rows] = await pool.execute(`
      SELECT
        COALESCE(SUM(valor_total - valor_pagado), 0)                                     AS total_por_pagar,
        COALESCE(SUM(valor_pagado), 0)                                                    AS total_pagado,
        COALESCE(SUM(CASE WHEN estado != 'pagada' AND fecha_venc < CURDATE()
                           THEN 1 ELSE 0 END), 0)                                         AS facturas_vencidas,
        COALESCE(SUM(CASE WHEN estado != 'pagada'
                           AND fecha_venc BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                           THEN 1 ELSE 0 END), 0)                                         AS facturas_proximas
      FROM facturas_proveedor
    `);
    const r = rows[0];
    return {
      total_por_pagar:   parseFloat(r.total_por_pagar),
      total_pagado:      parseFloat(r.total_pagado),
      facturas_vencidas: r.facturas_vencidas,
      facturas_proximas: r.facturas_proximas,
    };
  },

  eliminar: async (id) => {
    await pool.execute("DELETE FROM facturas_proveedor WHERE id = ?", [id]);
  },
};

module.exports = FacturaProveedor;
