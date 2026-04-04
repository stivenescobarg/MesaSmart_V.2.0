// backend/src/models/Caja.js — ACTUALIZADO con egresos en cierre
const { pool } = require("../config/db");

const Caja = {
  abrir: async (usuario_id, monto_inicial) => {
    const [r] = await pool.execute(
      "INSERT INTO caja (usuario_id, monto_inicial) VALUES (?, ?)",
      [usuario_id, monto_inicial]
    );
    return r.insertId;
  },

  getAbierta: async () => {
    const [r] = await pool.execute(
      "SELECT * FROM caja WHERE estado='abierta' ORDER BY apertura DESC LIMIT 1"
    );
    return r[0] || null;
  },

  cerrar: async (caja_id, cerrado_por) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Totales de ventas
      const [t] = await conn.execute(
        `SELECT
           COALESCE(SUM(total), 0) as tv,
           COALESCE(SUM(CASE WHEN metodo_pago='efectivo'      THEN total ELSE 0 END), 0) as ef,
           COALESCE(SUM(CASE WHEN metodo_pago='tarjeta'       THEN total ELSE 0 END), 0) as tj,
           COALESCE(SUM(CASE WHEN metodo_pago='transferencia' THEN total ELSE 0 END), 0) as tr,
           COUNT(*) as cv
         FROM ventas WHERE caja_id = ?`,
        [caja_id]
      );

      // Total egresos
      const [eg] = await conn.execute(
        "SELECT COALESCE(SUM(monto), 0) as total_egresos FROM egresos WHERE caja_id = ?",
        [caja_id]
      );

      const [c] = await conn.execute(
        "SELECT monto_inicial FROM caja WHERE id = ?", [caja_id]
      );

      const tv  = parseFloat(t[0].tv)  || 0;
      const ef  = parseFloat(t[0].ef)  || 0;
      const te  = parseFloat(eg[0].total_egresos) || 0;
      const mi  = parseFloat(c[0]?.monto_inicial) || 0;
      const mf  = mi + tv;
      const efn = ef - te; // efectivo real disponible

      // Actualizar caja
      await conn.execute(
        `UPDATE caja SET estado='cerrada', cierre=NOW(),
         total_ventas=?, monto_final=? WHERE id=?`,
        [tv, mf, caja_id]
      );

      // Guardar en historial
      await conn.execute(
        `INSERT INTO historial_caja
         (caja_id, fecha, monto_inicial, total_ventas, monto_final,
          total_efectivo, total_tarjeta, total_transf, cant_ventas,
          total_egresos, efectivo_neto, cerrado_por)
         VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [caja_id, mi, tv, mf,
         ef, parseFloat(t[0].tj)||0, parseFloat(t[0].tr)||0,
         t[0].cv||0, te, efn, cerrado_por]
      );

      await conn.commit();
      return { total_ventas: tv, monto_final: mf, total_egresos: te, efectivo_neto: efn };
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  getVentas: async (caja_id) => {
    const [ventas] = await pool.execute(
      "SELECT * FROM ventas WHERE caja_id=? ORDER BY creado_en", [caja_id]
    );
    for (const v of ventas) {
      const [items] = await pool.execute(
        "SELECT * FROM detalle_venta WHERE venta_id=?", [v.id]
      );
      v.items  = items;
      v.total  = parseFloat(v.total) || 0;
    }
    return ventas;
  },

  getHistorial: async () => {
    const [jornadas] = await pool.execute(
      `SELECT hc.*, u.nombre as cerrado_por_nombre
       FROM historial_caja hc
       LEFT JOIN usuarios u ON u.id = hc.cerrado_por
       ORDER BY hc.fecha DESC`
    );
    for (const dia of jornadas) {
      const [ventas] = await pool.execute(
        `SELECT v.id, v.mesa_nombre, v.total, v.metodo_pago, v.hora, v.fecha
         FROM ventas v WHERE v.caja_id = ? ORDER BY v.creado_en`,
        [dia.caja_id]
      );
      for (const venta of ventas) {
        const [items] = await pool.execute(
          "SELECT nombre, cantidad, precio FROM detalle_venta WHERE venta_id=?",
          [venta.id]
        );
        venta.items = items;
        venta.total = parseFloat(venta.total) || 0;
      }
      dia.ventas          = ventas;
      dia.monto_inicial   = parseFloat(dia.monto_inicial)   || 0;
      dia.total_ventas    = parseFloat(dia.total_ventas)    || 0;
      dia.monto_final     = parseFloat(dia.monto_final)     || 0;
      dia.total_efectivo  = parseFloat(dia.total_efectivo)  || 0;
      dia.total_tarjeta   = parseFloat(dia.total_tarjeta)   || 0;
      dia.total_transf    = parseFloat(dia.total_transf)    || 0;
      dia.total_egresos   = parseFloat(dia.total_egresos)   || 0;
      dia.efectivo_neto   = parseFloat(dia.efectivo_neto)   || 0;
    }
    return jornadas;
  },

  // Para el PDF: datos completos de cierre
  getDatosParaPDF: async (caja_id) => {
    const [caja] = await pool.execute(
      `SELECT c.*, u.nombre as abierto_por_nombre
       FROM caja c JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ? LIMIT 1`,
      [caja_id]
    );
    if (!caja[0]) return null;

    const ventas  = await Caja.getVentas(caja_id);
    const [eg]    = await pool.execute(
      `SELECT e.*, u.nombre as usuario_nombre
       FROM egresos e JOIN usuarios u ON u.id = e.usuario_id
       WHERE e.caja_id = ? ORDER BY e.creado_en`,
      [caja_id]
    );

    return {
      caja:    caja[0],
      ventas,
      egresos: eg.map(e => ({ ...e, monto: parseFloat(e.monto) || 0 })),
    };
  },
};

const Venta = {
  registrar: async ({ caja_id, pedido_id, mesa_nombre, total, metodo_pago, usuario_id, items }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const fecha = new Date().toISOString().split("T")[0];
      const hora  = new Date().toTimeString().slice(0, 8);
      const [r] = await conn.execute(
        `INSERT INTO ventas (caja_id, pedido_id, mesa_nombre, total, metodo_pago, usuario_id, fecha, hora)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [caja_id, pedido_id||null, mesa_nombre, total, metodo_pago, usuario_id||null, fecha, hora]
      );
      const venta_id = r.insertId;
      if (items?.length) {
        for (const item of items) {
          await conn.execute(
            "INSERT INTO detalle_venta (venta_id, nombre, cantidad, precio) VALUES (?,?,?,?)",
            [venta_id, item.nombre, item.cantidad, item.precio]
          );
        }
      }
      if (pedido_id) {
        await conn.execute("UPDATE pedidos SET estado='pagado' WHERE id=?", [pedido_id]);
      }
      await conn.commit();
      return venta_id;
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },
};

module.exports = { Caja, Venta };