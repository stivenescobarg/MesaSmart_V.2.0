const { pool } = require("../config/db");

const ESTADOS = ["pendiente", "en_preparacion", "listo", "cancelado"];
const TRANSICIONES = {
  pendiente: ["en_preparacion", "cancelado"],
  en_preparacion: ["listo", "cancelado"],
  listo: [],
  cancelado: [],
};

const parseItems = (orden) => ({
  ...orden,
  items: typeof orden.items === "string" ? JSON.parse(orden.items) : orden.items,
});

const enriquecerImagenes = async (ordenes) => {
  const nombres = [...new Set(
    ordenes.flatMap(orden => orden.items.map(item => item.nombre))
  )];
  if (nombres.length === 0) return ordenes;

  const [productos] = await pool.query(
    "SELECT nombre, imagen FROM productos WHERE nombre COLLATE utf8mb4_unicode_ci IN (?)",
    [nombres]
  );
  const imagenPorNombre = new Map(productos.map(p => [p.nombre, p.imagen]));

  return ordenes.map(orden => ({
    ...orden,
    items: orden.items.map(item => ({
      ...item,
      imgKey: item.imgKey || imagenPorNombre.get(item.nombre) || null,
    })),
  }));
};

const OrdenBar = {
  estados: ESTADOS,

  async crear({ restaurante_id, mesa, items, observacion }) {
    const [result] = await pool.execute(
      `INSERT INTO ordenes_bar (restaurante_id, mesa, items, observacion)
       VALUES (?, ?, ?, ?)`,
      [restaurante_id, mesa.trim(), JSON.stringify(items), observacion || null]
    );
    return result.insertId;
  },

  async activas(restaurante_id) {
    const [rows] = await pool.query(
      `SELECT id, mesa, items, observacion, estado, creado_en, iniciado_en, listo_en
       FROM ordenes_bar
       WHERE restaurante_id = ? AND estado IN ('pendiente', 'en_preparacion')
       ORDER BY creado_en ASC`,
      [restaurante_id]
    );
    return enriquecerImagenes(rows.map(parseItems));
  },

  async historialHoy(restaurante_id) {
    const [rows] = await pool.query(
      `SELECT id, mesa, items, observacion, estado, creado_en, iniciado_en, listo_en
       FROM ordenes_bar
       WHERE restaurante_id = ?
         AND DATE(COALESCE(listo_en, creado_en)) = CURDATE()
         AND estado IN ('listo', 'cancelado')
       ORDER BY COALESCE(listo_en, creado_en) DESC
       LIMIT 50`,
      [restaurante_id]
    );
    return enriquecerImagenes(rows.map(parseItems));
  },

  async resumenHoy(restaurante_id) {
    const [[resumen]] = await pool.query(
      `SELECT
        SUM(estado IN ('pendiente', 'en_preparacion')) AS activas,
        SUM(estado = 'pendiente') AS pendientes,
        SUM(estado = 'en_preparacion') AS en_preparacion,
        SUM(estado = 'listo' AND DATE(listo_en) = CURDATE()) AS listas_hoy
       FROM ordenes_bar
       WHERE restaurante_id = ? AND (DATE(creado_en) = CURDATE() OR DATE(listo_en) = CURDATE())`,
      [restaurante_id]
    );
    const [ordenes] = await pool.query(
      `SELECT items FROM ordenes_bar
       WHERE restaurante_id = ? AND (DATE(creado_en) = CURDATE() OR DATE(listo_en) = CURDATE())`,
      [restaurante_id]
    );
    const bebidas_hoy = ordenes.reduce((total, orden) => {
      const items = typeof orden.items === "string" ? JSON.parse(orden.items) : orden.items;
      return total + (items || []).reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
    }, 0);
    return { ...resumen, bebidas_hoy };
  },

  async actualizarEstado(id, restaurante_id, estado, usuarioId = null) {
    if (!ESTADOS.includes(estado)) return { error: "Estado inválido." };
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[orden]] = await conn.execute(
        "SELECT id, estado, items FROM ordenes_bar WHERE id = ? AND restaurante_id = ? FOR UPDATE",
        [id, restaurante_id]
      );
      if (!orden) {
        await conn.rollback();
        return { error: "Orden no encontrada.", status: 404 };
      }
      if (!TRANSICIONES[orden.estado].includes(estado)) {
        await conn.rollback();
        return { error: `No se puede cambiar una orden ${orden.estado} a ${estado}.`, status: 409 };
      }
      const camposFecha = estado === "en_preparacion"
        ? ", iniciado_en = COALESCE(iniciado_en, NOW())"
        : estado === "listo" ? ", listo_en = NOW()" : "";
      await conn.execute(`UPDATE ordenes_bar SET estado = ?${camposFecha} WHERE id = ?`, [estado, id]);
      await conn.commit();
      return { id: Number(id), estado };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { conn.release(); }
  },
};

module.exports = OrdenBar;