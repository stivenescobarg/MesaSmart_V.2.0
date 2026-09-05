// backend/src/models/Caja.js — con aislamiento multi-tenant (Fase 3)
//
// ✅ CAMBIOS para soportar servicio 10% / propina / descuento / subcuentas:
// 1. Venta.registrar ahora guarda consumo, descuento, servicio, propina y
//    subcuenta_nombre (todas opcionales, con default 0/NULL).
// 2. Caja.cerrar ahora también suma servicio/propina/descuento del día y
//    los deja en historial_caja y en el resultado (para el PDF).
// 3. Caja.getHistorial ahora trae esas columnas también, tanto a nivel de
//    jornada (historial_caja) como por venta individual.
//
// ✅ NUEVO — PAGO MIXTO (varios métodos en una misma venta):
// 4. Venta.registrar ahora acepta un `pagos` opcional: [{ metodo_pago, monto }].
//    - Si no viene, se arma automáticamente un desglose de 1 solo método
//      con (metodo_pago, total) → 100% retrocompatible con el flujo actual.
//    - Si viene con más de un método, `ventas.metodo_pago` se guarda como
//      'mixto' (requiere la migración que amplía el enum) y el detalle
//      real de cuánto fue en cada método vive en la tabla `venta_pagos`.
//    - Se valida en el servidor que la suma del desglose cuadre con el
//      total (tolerancia de $1 por redondeos).
// 5. Caja.cerrar ahora calcula total_efectivo/total_tarjeta/total_transf
//    SUMANDO DESDE `venta_pagos`, no desde `ventas.metodo_pago`. Esto es
//    crítico: si no se hace así, una venta mixta (ej. $40.000 efectivo +
//    $160.000 transferencia) quedaría contada COMPLETA en un solo método
//    al momento de cuadrar la caja física, generando un descuadre real.
// 6. Caja.getVentas / Caja.getHistorial ahora traen también `venta.pagos`
//    (el desglose) para poder mostrarlo en el historial o en el PDF.
const { pool } = require("../config/db");

const Caja = {
  abrir: async (usuario_id, monto_inicial, restaurante_id) => {
    const [r] = await pool.execute(
      "INSERT INTO caja (usuario_id, monto_inicial, apertura, restaurante_id) VALUES (?, ?, ?, ?)",
      [usuario_id, monto_inicial, new Date(), restaurante_id]
    );
    return r.insertId;
  },

  getAbierta: async (restaurante_id) => {
    const [r] = await pool.execute(
      "SELECT * FROM caja WHERE estado='abierta' AND restaurante_id=? ORDER BY apertura DESC LIMIT 1",
      [restaurante_id]
    );
    return r[0] || null;
  },

  cerrar: async (caja_id, cerrado_por, restaurante_id) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verificación de pertenencia ANTES de tocar nada — si alguien manda un caja_id
      // que no es suyo (de otro restaurante), esto corta aquí con un 404, no con datos cruzados.
      const [[cajaRow]] = await conn.execute(
        "SELECT id, monto_inicial FROM caja WHERE id=? AND restaurante_id=? FOR UPDATE",
        [caja_id, restaurante_id]
      );
      if (!cajaRow) {
        await conn.rollback();
        const err = new Error("Caja no encontrada para este restaurante.");
        err.status = 404;
        throw err;
      }

      // Totales generales de la jornada (estos SÍ vienen de `ventas` directo,
      // uno por venta, sin fan-out posible).
      const [t] = await conn.execute(
        `SELECT
           COALESCE(SUM(total), 0) as tv,
           COALESCE(SUM(servicio), 0)  as tserv,
           COALESCE(SUM(propina), 0)   as tprop,
           COALESCE(SUM(descuento), 0) as tdesc,
           COUNT(*) as cv
         FROM ventas WHERE caja_id = ?`,
        [caja_id]
      );

      // ── NUEVO: efectivo/tarjeta/transferencia SIEMPRE desde venta_pagos.
      // Una venta puede tener 1 o varias filas en venta_pagos, así que este
      // query se hace por separado (join con `ventas` solo para filtrar por
      // caja_id) y NUNCA se mezcla con el SUM(total) de arriba, para no
      // duplicar el total de la venta si tiene más de un método.
      const [mp] = await conn.execute(
        `SELECT
           COALESCE(SUM(CASE WHEN vp.metodo_pago='efectivo'      THEN vp.monto ELSE 0 END), 0) as ef,
           COALESCE(SUM(CASE WHEN vp.metodo_pago='tarjeta'       THEN vp.monto ELSE 0 END), 0) as tj,
           COALESCE(SUM(CASE WHEN vp.metodo_pago='transferencia' THEN vp.monto ELSE 0 END), 0) as tr
         FROM venta_pagos vp
         JOIN ventas v ON v.id = vp.venta_id
         WHERE v.caja_id = ?`,
        [caja_id]
      );

      const [eg] = await conn.execute(
        "SELECT COALESCE(SUM(monto), 0) as total_egresos FROM egresos WHERE caja_id = ?",
        [caja_id]
      );

      const tv    = parseFloat(t[0].tv)    || 0;
      const ef    = parseFloat(mp[0].ef)   || 0;
      const tj    = parseFloat(mp[0].tj)   || 0;
      const tr    = parseFloat(mp[0].tr)   || 0;
      const tserv = parseFloat(t[0].tserv) || 0;
      const tprop = parseFloat(t[0].tprop) || 0;
      const tdesc = parseFloat(t[0].tdesc) || 0;
      const te    = parseFloat(eg[0].total_egresos) || 0;
      const mi    = parseFloat(cajaRow.monto_inicial) || 0;
      const mf    = mi + tv;
      const efn   = ef - te;
      const ahora = new Date();

      await conn.execute(
        `UPDATE caja SET estado='cerrada', cierre=?,
         total_ventas=?, monto_final=? WHERE id=? AND restaurante_id=?`,
        [ahora, tv, mf, caja_id, restaurante_id]
      );

      await conn.execute(
        `INSERT INTO historial_caja
         (caja_id, fecha, monto_inicial, total_ventas, monto_final,
          total_efectivo, total_tarjeta, total_transf, cant_ventas,
          total_egresos, efectivo_neto, cerrado_por,
          total_servicio, total_propinas, total_descuentos)
         VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [caja_id, mi, tv, mf,
         ef, tj, tr,
         t[0].cv||0, te, efn, cerrado_por,
         tserv, tprop, tdesc]
      );

      await conn.commit();
      return {
        total_ventas: tv, monto_final: mf, total_egresos: te, efectivo_neto: efn,
        total_servicio: tserv, total_propinas: tprop, total_descuentos: tdesc,
        total_efectivo: ef, total_tarjeta: tj, total_transferencia: tr,
      };
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  // Trae también el desglose (`venta.pagos`) de cada venta, para poder
  // mostrar en el historial/PDF cómo se dividió el cobro cuando fue mixto.
  getVentas: async (caja_id) => {
    const [ventas] = await pool.execute(
      "SELECT * FROM ventas WHERE caja_id=? ORDER BY creado_en", [caja_id]
    );
    for (const v of ventas) {
      const [items] = await pool.execute(
        "SELECT * FROM detalle_venta WHERE venta_id=?", [v.id]
      );
      const [pagos] = await pool.execute(
        "SELECT metodo_pago, monto FROM venta_pagos WHERE venta_id=?", [v.id]
      );
      v.items     = items;
      v.pagos     = pagos.map(p => ({ ...p, monto: parseFloat(p.monto) || 0 }));
      v.total     = parseFloat(v.total)     || 0;
      v.consumo   = parseFloat(v.consumo)   || 0;
      v.descuento = parseFloat(v.descuento) || 0;
      v.servicio  = parseFloat(v.servicio)  || 0;
      v.propina   = parseFloat(v.propina)   || 0;
    }
    return ventas;
  },

  getHistorial: async (restaurante_id) => {
    const [jornadas] = await pool.execute(
      `SELECT hc.*, u.nombre as cerrado_por_nombre
       FROM historial_caja hc
       JOIN caja c ON c.id = hc.caja_id
       LEFT JOIN usuarios u ON u.id = hc.cerrado_por
       WHERE c.restaurante_id = ?
       ORDER BY hc.fecha DESC`,
      [restaurante_id]
    );
    for (const dia of jornadas) {
      const [ventas] = await pool.execute(
        `SELECT v.id, v.mesa_nombre, v.subcuenta_nombre, v.total,
                v.consumo, v.descuento, v.servicio, v.propina,
                v.metodo_pago, v.hora, v.fecha
         FROM ventas v WHERE v.caja_id = ? ORDER BY v.creado_en`,
        [dia.caja_id]
      );
      for (const venta of ventas) {
        const [items] = await pool.execute(
          "SELECT nombre, cantidad, precio FROM detalle_venta WHERE venta_id=?",
          [venta.id]
        );
        const [pagos] = await pool.execute(
          "SELECT metodo_pago, monto FROM venta_pagos WHERE venta_id=?",
          [venta.id]
        );
        venta.items     = items;
        venta.pagos     = pagos.map(p => ({ ...p, monto: parseFloat(p.monto) || 0 }));
        venta.total     = parseFloat(venta.total)     || 0;
        venta.consumo   = parseFloat(venta.consumo)   || 0;
        venta.descuento = parseFloat(venta.descuento) || 0;
        venta.servicio  = parseFloat(venta.servicio)  || 0;
        venta.propina   = parseFloat(venta.propina)   || 0;
      }
      dia.ventas            = ventas;
      dia.monto_inicial     = parseFloat(dia.monto_inicial)     || 0;
      dia.total_ventas      = parseFloat(dia.total_ventas)      || 0;
      dia.monto_final       = parseFloat(dia.monto_final)       || 0;
      dia.total_efectivo    = parseFloat(dia.total_efectivo)    || 0;
      dia.total_tarjeta     = parseFloat(dia.total_tarjeta)     || 0;
      dia.total_transf      = parseFloat(dia.total_transf)      || 0;
      dia.total_egresos     = parseFloat(dia.total_egresos)     || 0;
      dia.efectivo_neto     = parseFloat(dia.efectivo_neto)     || 0;
      dia.total_servicio    = parseFloat(dia.total_servicio)    || 0;
      dia.total_propinas    = parseFloat(dia.total_propinas)    || 0;
      dia.total_descuentos  = parseFloat(dia.total_descuentos)  || 0;
    }
    return jornadas;
  },

  getDatosParaPDF: async (caja_id, restaurante_id) => {
    const [caja] = await pool.execute(
      `SELECT c.*, u.nombre as abierto_por_nombre
       FROM caja c JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = ? AND c.restaurante_id = ? LIMIT 1`,
      [caja_id, restaurante_id]
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
  registrar: async ({
    caja_id, pedido_id, mesa_nombre, total, metodo_pago, usuario_id, items,
    consumo = null, descuento = 0, servicio = 0, propina = 0,
    subcuenta_nombre = null,
    // ── NUEVO: desglose de pago mixto. [{ metodo_pago, monto }, ...]
    // Si no viene (flujo viejo), se arma un desglose de 1 solo método
    // con metodo_pago + total, así todo lo demás (venta_pagos, cierre
    // de caja) funciona igual sin importar si el caller manda esto o no.
    pagos = null,
    restaurante_id,
  }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const ahora = new Date();
      const fecha = ahora.toISOString().split("T")[0];
      const hora  = ahora.toISOString().split("T")[1].slice(0, 8);

      const consumoFinal = consumo ?? total;

      const desglose = (pagos && pagos.length)
        ? pagos
        : [{ metodo_pago, monto: total }];

      // Validación de servidor (no confiar solo en el frontend): la suma
      // del desglose debe cuadrar con el total, con $1 de tolerancia por
      // redondeos de coma flotante.
      const sumaPagos = desglose.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
      if (Math.abs(sumaPagos - parseFloat(total)) > 1) {
        const err = new Error("La suma de los métodos de pago no coincide con el total.");
        err.status = 400;
        throw err;
      }

      // Si hay más de un método, se guarda 'mixto' en ventas.metodo_pago
      // (requiere la migración que amplía el enum). El detalle real de
      // cuánto fue en cada método vive en venta_pagos.
      const metodoFinal = desglose.length === 1 ? desglose[0].metodo_pago : "mixto";

      const [r] = await conn.execute(
        `INSERT INTO ventas
           (caja_id, pedido_id, mesa_nombre, total, metodo_pago, usuario_id, fecha, hora,
            consumo, descuento, servicio, propina, subcuenta_nombre, restaurante_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [caja_id, pedido_id||null, mesa_nombre, total, metodoFinal, usuario_id||null, fecha, hora,
         consumoFinal, descuento, servicio, propina, subcuenta_nombre, restaurante_id]
      );
      const venta_id = r.insertId;

      for (const pago of desglose) {
        await conn.execute(
          "INSERT INTO venta_pagos (venta_id, metodo_pago, monto) VALUES (?, ?, ?)",
          [venta_id, pago.metodo_pago, pago.monto]
        );
      }

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

   getAllPeriodo: async ({ restaurante_id, fecha_desde, fecha_hasta }) => {
    const [rows] = await pool.execute(
      `SELECT v.id, v.fecha, v.hora, v.mesa_nombre, v.total, v.metodo_pago,
              v.consumo, v.descuento, v.servicio, v.propina
       FROM ventas v
       JOIN caja c ON c.id = v.caja_id
       WHERE c.restaurante_id = ? AND v.fecha BETWEEN ? AND ?
       ORDER BY v.fecha DESC, v.hora DESC`,
      [restaurante_id, fecha_desde, fecha_hasta]
    );
    return rows.map(r => ({
      ...r,
      total:     parseFloat(r.total)     || 0,
      consumo:   parseFloat(r.consumo)   || 0,
      descuento: parseFloat(r.descuento) || 0,
      servicio:  parseFloat(r.servicio)  || 0,
      propina:   parseFloat(r.propina)   || 0,
    }));
  },
};

module.exports = { Caja, Venta };