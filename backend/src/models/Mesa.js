// backend/src/models/Mesa.js — actualizado con zonas y posicionamiento
const { pool } = require("../config/db");

const Mesa = {
  // Todas las mesas con pedidos activos y datos de zona
  findAll: async () => {
    const [mesas] = await pool.execute(
      `SELECT m.*,
              z.nombre  AS zona_nombre,
              z.color   AS zona_color
       FROM mesas m
       LEFT JOIN zonas z ON z.id = m.zona_id
       WHERE m.activa = TRUE
       ORDER BY m.id`
    );

    for (const m of mesas) {
      const [items] = await pool.execute(
        `SELECT dp.id as item_id, dp.nombre, dp.cantidad, dp.precio,
                dp.categoria, dp.observacion, p.id as pedido_id, p.estado, p.total
         FROM pedidos p
         JOIN detalle_pedido dp ON dp.pedido_id = p.id
         WHERE p.mesa_id = ? AND p.estado NOT IN ('pagado','cancelado')
         ORDER BY p.creado_en`,
        [m.id]
      );
      m.pedido   = items;
      m.ocupada  = items.length > 0;
      m.total    = items.reduce((a, i) => a + (parseFloat(i.precio) || 0) * i.cantidad, 0);
      // Convertir pos a número
      m.pos_x    = parseInt(m.pos_x)    || 0;
      m.pos_y    = parseInt(m.pos_y)    || 0;
      m.capacidad = parseInt(m.capacidad) || 4;
    }
    return mesas;
  },

  findById: async (id) => {
    const [r] = await pool.execute(
      "SELECT * FROM mesas WHERE id = ? AND activa = TRUE LIMIT 1", [id]
    );
    return r[0] || null;
  },

  create: async ({ nombre, zona_id, capacidad, pos_x, pos_y, forma }) => {
    const [r] = await pool.execute(
      `INSERT INTO mesas (nombre, zona_id, capacidad, pos_x, pos_y, forma)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        zona_id    || null,
        capacidad  || 4,
        pos_x      || 0,
        pos_y      || 0,
        forma      || "cuadrada",
      ]
    );
    return r.insertId;
  },

  updateEstado: async (id, estado) => {
    await pool.execute("UPDATE mesas SET estado = ? WHERE id = ?", [estado, id]);
  },

  // Guardar posición tras drag-and-drop
  updatePosicion: async (id, pos_x, pos_y) => {
    await pool.execute(
      "UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ?",
      [pos_x, pos_y, id]
    );
  },

  // Actualizar zona, capacidad y forma
  updateConfig: async (id, { zona_id, capacidad, forma, nombre }) => {
    await pool.execute(
      `UPDATE mesas SET zona_id=?, capacidad=?, forma=?, nombre=? WHERE id=?`,
      [zona_id || null, capacidad || 4, forma || "cuadrada", nombre, id]
    );
  },

  // Guardar múltiples posiciones de golpe (drag masivo)
  updatePosicionBatch: async (posiciones) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const { id, pos_x, pos_y } of posiciones) {
        await conn.execute(
          "UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ?",
          [pos_x, pos_y, id]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  delete: async (id) => {
    await pool.execute("UPDATE mesas SET activa = FALSE WHERE id = ?", [id]);
  },
};

module.exports = Mesa;