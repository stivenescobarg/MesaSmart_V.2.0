const { pool } = require("../config/db");

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

  // Órdenes creadas por intervalo de N minutos, dentro de la ventana de tiempo indicada.
  // Devuelve filas { bucket, cantidad } donde bucket = 0 es el intervalo más reciente
  // (los últimos `intervalo_minutos` minutos) y crece hacia el pasado.
  async actividadReciente(restaurante_id, minutos = 60, intervalo_minutos = 5) {
    const [rows] = await pool.query(
      `SELECT
         FLOOR(TIMESTAMPDIFF(MINUTE, creado_en, NOW()) / ?) AS bucket,
         COUNT(*) AS cantidad
       FROM ordenes_bar
       WHERE restaurante_id = ?
         AND creado_en >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
       GROUP BY bucket`,
      [intervalo_minutos, restaurante_id, minutos]
    );
    return rows;
  },
};

module.exports = OrdenBar;