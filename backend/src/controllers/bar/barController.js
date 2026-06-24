// backend/src/controllers/bar/barController.js
const { pool } = require("../../config/db");

// ══════════════════════════════════════════════════════════════════════════════
// ÓRDENES DE BAR
// ══════════════════════════════════════════════════════════════════════════════

const getOrdenes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.id,
        m.nombre        AS mesa,
        p.estado,
        p.observacion,
        p.creado_en,
        p.anclada,
        p.pausada,
        CONCAT('[', GROUP_CONCAT(
          JSON_OBJECT(
            'id',          dp.id,
            'nombre',      dp.nombre,
            'cantidad',    dp.cantidad,
            'precio',      dp.precio,
            'categoria',   dp.categoria,
            'observacion', dp.observacion
          ) SEPARATOR ','
        ), ']') AS items
      FROM pedidos p
      JOIN mesas          m  ON m.id  = p.mesa_id
      JOIN detalle_pedido dp ON dp.pedido_id = p.id
      WHERE p.estado NOT IN ('pagado', 'cancelado', 'listo')
        AND dp.categoria = 'bebida'
      GROUP BY p.id, m.nombre, p.estado, p.observacion, p.creado_en, p.anclada, p.pausada
      ORDER BY p.anclada DESC, p.creado_en ASC
    `);

    const ordenes = rows.map(o => ({
      ...o,
      items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
    }));

    res.json({ ok: true, ordenes });
  } catch (err) {
    console.error("[barController] getOrdenes:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const marcarListo = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE pedidos SET estado = 'listo' WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[barController] marcarListo:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const updateEstado = async (req, res) => {
  try {
    const { id }     = req.params;
    const { estado } = req.body;
    const validos = ["pendiente", "en_preparacion", "pausado", "listo"];
    if (!validos.includes(estado))
      return res.status(400).json({ ok: false, error: "Estado inválido" });
    if (estado === "pausado") {
      await pool.execute("UPDATE pedidos SET pausada = 1 WHERE id = ?", [id]);
    } else {
      await pool.execute(
        "UPDATE pedidos SET pausada = 0, estado = ? WHERE id = ?",
        [estado, id]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[barController] updateEstado:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const toggleAnclada = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE pedidos SET anclada = NOT anclada WHERE id = ?", [id]);
    const [[orden]] = await pool.execute("SELECT anclada FROM pedidos WHERE id = ?", [id]);
    res.json({ ok: true, anclada: !!orden?.anclada });
  } catch (err) {
    console.error("[barController] toggleAnclada:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// INVENTARIO
// ══════════════════════════════════════════════════════════════════════════════

const getInventario = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, unidad, stock_actual, stock_minimo,
             stock_actual < stock_minimo AS alerta, ultima_actualizacion
      FROM bar_inventario ORDER BY nombre ASC
    `);
    res.json({ ok: true, inventario: rows });
  } catch (err) {
    console.error("[barController] getInventario:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const addProducto = async (req, res) => {
  try {
    const { nombre, unidad = "L", stock_actual = 0, stock_minimo = 2 } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: "nombre requerido" });
    const [r] = await pool.execute(
      "INSERT INTO bar_inventario (nombre, unidad, stock_actual, stock_minimo) VALUES (?, ?, ?, ?)",
      [nombre, unidad, stock_actual, stock_minimo]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (err) {
    console.error("[barController] addProducto:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_actual, stock_minimo, nombre, unidad } = req.body;
    const campos = [], vals = [];
    if (nombre       !== undefined) { campos.push("nombre = ?");       vals.push(nombre); }
    if (unidad       !== undefined) { campos.push("unidad = ?");       vals.push(unidad); }
    if (stock_actual !== undefined) { campos.push("stock_actual = ?"); vals.push(stock_actual); }
    if (stock_minimo !== undefined) { campos.push("stock_minimo = ?"); vals.push(stock_minimo); }
    if (!campos.length) return res.status(400).json({ ok: false, error: "Nada que actualizar" });
    campos.push("ultima_actualizacion = NOW()");
    vals.push(id);
    await pool.execute(`UPDATE bar_inventario SET ${campos.join(", ")} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (err) {
    console.error("[barController] updateProducto:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM bar_inventario WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[barController] deleteProducto:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const getAlertas = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, unidad, stock_actual, stock_minimo
      FROM bar_inventario WHERE stock_actual < stock_minimo
      ORDER BY (stock_minimo - stock_actual) DESC
    `);
    res.json({ ok: true, alertas: rows });
  } catch (err) {
    console.error("[barController] getAlertas:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPRAS
// ══════════════════════════════════════════════════════════════════════════════

const getCompras = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT bc.id, bc.inventario_id, bi.nombre, bi.unidad,
             bc.cantidad_sugerida, bc.completado, bc.creado_en
      FROM bar_compras bc
      JOIN bar_inventario bi ON bi.id = bc.inventario_id
      WHERE bc.completado = 0
      ORDER BY bc.creado_en DESC
    `);
    res.json({ ok: true, compras: rows });
  } catch (err) {
    console.error("[barController] getCompras:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const addCompra = async (req, res) => {
  try {
    const { inventario_id, cantidad_sugerida = 1 } = req.body;
    if (!inventario_id) return res.status(400).json({ ok: false, error: "inventario_id requerido" });
    const [[dup]] = await pool.execute(
      "SELECT id FROM bar_compras WHERE inventario_id = ? AND completado = 0",
      [inventario_id]
    );
    if (dup) return res.json({ ok: true, id: dup.id, duplicado: true });
    const [r] = await pool.execute(
      "INSERT INTO bar_compras (inventario_id, cantidad_sugerida) VALUES (?, ?)",
      [inventario_id, cantidad_sugerida]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (err) {
    console.error("[barController] addCompra:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const completarCompra = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id }                    = req.params;
    const { cantidad_recibida = 0 } = req.body;
    await conn.beginTransaction();
    const [[compra]] = await conn.execute("SELECT * FROM bar_compras WHERE id = ?", [id]);
    if (!compra) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "No encontrada" });
    }
    await conn.execute("UPDATE bar_compras SET completado = 1 WHERE id = ?", [id]);
    if (cantidad_recibida > 0) {
      await conn.execute(
        "UPDATE bar_inventario SET stock_actual = stock_actual + ?, ultima_actualizacion = NOW() WHERE id = ?",
        [cantidad_recibida, compra.inventario_id]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error("[barController] completarCompra:", err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    conn.release();
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TURNOS DE BAR
// ══════════════════════════════════════════════════════════════════════════════

const iniciarTurno = async (req, res) => {
  try {
    const usuario_id = req.usuario?.id;
    const nombre     = req.usuario?.nombre || req.usuario?.email || "Bartender";
    const [[activo]] = await pool.execute(
      "SELECT id, inicio FROM bar_turnos WHERE usuario_id = ? AND activo = 1 LIMIT 1",
      [usuario_id]
    );
    if (activo) return res.json({ ok: true, turno_id: activo.id, ya_activo: true, inicio: activo.inicio });
    const [r] = await pool.execute(
      "INSERT INTO bar_turnos (usuario_id, bartender_nombre) VALUES (?, ?)",
      [usuario_id, nombre]
    );
    res.json({ ok: true, turno_id: r.insertId, ya_activo: false });
  } catch (err) {
    console.error("[barController] iniciarTurno:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const getTurnoActivo = async (req, res) => {
  try {
    const usuario_id = req.usuario?.id;
    const [[turno]]  = await pool.execute(
      "SELECT id, inicio, bartender_nombre FROM bar_turnos WHERE usuario_id = ? AND activo = 1 LIMIT 1",
      [usuario_id]
    );
    res.json({ ok: true, turno: turno || null });
  } catch (err) {
    console.error("[barController] getTurnoActivo:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const getSesiones = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        id,
        bartender_nombre  AS bartender,
        inicio            AS fecha,
        fin,
        total_bebidas,
        total_ordenes     AS ordenes_completadas,
        detalle_bebidas   AS detalles_raw,
        TIMESTAMPDIFF(MINUTE, inicio, fin) AS duracion_minutos
      FROM bar_turnos
      WHERE activo = 0 AND fin IS NOT NULL
      ORDER BY fin DESC
      LIMIT 50
    `);
    const sesiones = rows.map(r => ({
      ...r,
      detalles: r.detalles_raw
        ? (typeof r.detalles_raw === "string" ? JSON.parse(r.detalles_raw) : r.detalles_raw)
        : [],
      detalles_raw: undefined,
    }));
    res.json({ ok: true, sesiones });
  } catch (err) {
    console.error("[barController] getSesiones:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const cerrarTurno = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const usuario_id                   = req.usuario?.id;
    const { turno_id, historial = [] } = req.body;
    if (!turno_id) return res.status(400).json({ ok: false, error: "turno_id requerido" });

    const [[turno]] = await conn.execute(
      "SELECT * FROM bar_turnos WHERE id = ? AND usuario_id = ? AND activo = 1",
      [turno_id, usuario_id]
    );
    if (!turno) return res.status(404).json({ ok: false, error: "Turno no encontrado o ya cerrado" });

    await conn.beginTransaction();

    const bebidas = {};
    historial.forEach(h => {
      const nombre = h.drink || "Bebida";
      bebidas[nombre] = (bebidas[nombre] || 0) + (h.drinks || 1);
    });
    const detalle_bebidas = Object.entries(bebidas)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    const total_bebidas = detalle_bebidas.reduce((a, b) => a + b.cantidad, 0);
    const total_ordenes = historial.length;

    await conn.execute(
      `UPDATE bar_turnos SET
         activo = 0, fin = NOW(),
         total_bebidas = ?, total_ordenes = ?, detalle_bebidas = ?
       WHERE id = ?`,
      [total_bebidas, total_ordenes, JSON.stringify(detalle_bebidas), turno_id]
    );
    await conn.commit();

    const [[turnoFinal]] = await conn.execute(
      "SELECT * FROM bar_turnos WHERE id = ?", [turno_id]
    );

    const porHora = {};
    historial.forEach(h => {
      const hora = new Date(h.at).getHours();
      porHora[hora] = (porHora[hora] || 0) + (h.drinks || 1);
    });
    const horaPico = Object.entries(porHora).sort((a, b) => b[1] - a[1])[0];

    const porMesa = {};
    historial.forEach(h => {
      const mesa = h.mesa?.replace(/\D/g, "") || "?";
      porMesa[mesa] = (porMesa[mesa] || 0) + (h.drinks || 1);
    });
    const mesasTop = Object.entries(porMesa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mesa, beb]) => ({ mesa, bebidas: beb }));

    res.json({
      ok: true,
      resumen: {
        bartender:    turnoFinal.bartender_nombre,
        inicio:       turnoFinal.inicio,
        fin:          turnoFinal.fin,
        duracion_min: Math.round((new Date(turnoFinal.fin) - new Date(turnoFinal.inicio)) / 60000),
        total_bebidas,
        total_ordenes,
        detalle_bebidas,
        hora_pico:    horaPico ? { hora: `${horaPico[0]}:00`, bebidas: horaPico[1] } : null,
        mesas_top:    mesasTop,
        historial,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error("[barController] cerrarTurno:", err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    conn.release();
  }
};

module.exports = {
  getOrdenes, marcarListo, updateEstado, toggleAnclada,
  getInventario, addProducto, updateProducto, deleteProducto, getAlertas,
  getCompras, addCompra, completarCompra,
  iniciarTurno, getTurnoActivo, cerrarTurno, getSesiones,
};