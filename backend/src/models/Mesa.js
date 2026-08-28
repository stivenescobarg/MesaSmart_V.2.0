const { pool } = require("../config/db");

const Mesa = {
  findAll: async (restaurante_id) => {
    const [mesas] = await pool.execute(
      `SELECT m.*, z.nombre AS zona_nombre, z.color AS zona_color
       FROM mesas m
       LEFT JOIN zonas z ON z.id = m.zona_id
       WHERE m.activa = TRUE AND m.restaurante_id = ?
       ORDER BY m.id`,
      [restaurante_id]
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
      m.pedido    = items;
      m.ocupada   = items.length > 0;
      m.total     = items.reduce((a, i) => a + (parseFloat(i.precio) || 0) * i.cantidad, 0);
      m.pos_x     = parseInt(m.pos_x)     || 0;
      m.pos_y     = parseInt(m.pos_y)     || 0;
      m.capacidad = parseInt(m.capacidad) || 4;
    }
    return mesas;
  },

  findById: async (id, restaurante_id) => {
    const [r] = await pool.execute(
      "SELECT * FROM mesas WHERE id = ? AND restaurante_id = ? AND activa = TRUE LIMIT 1",
      [id, restaurante_id]
    );
    return r[0] || null;
  },

  create: async ({ restaurante_id, nombre, zona_id, capacidad, pos_x, pos_y, forma }) => {
    const [r] = await pool.execute(
      `INSERT INTO mesas (restaurante_id, nombre, zona_id, capacidad, pos_x, pos_y, forma)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurante_id, nombre, zona_id || null, capacidad || 4, pos_x || 0, pos_y || 0, forma || "cuadrada"]
    );
    return r.insertId;
  },

  updateEstado: async (id, restaurante_id, estado) => {
    const [r] = await pool.execute(
      "UPDATE mesas SET estado = ? WHERE id = ? AND restaurante_id = ?",
      [estado, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  updatePosicion: async (id, restaurante_id, pos_x, pos_y) => {
    const [r] = await pool.execute(
      "UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ? AND restaurante_id = ?",
      [pos_x, pos_y, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  updateConfig: async (id, restaurante_id, { zona_id, capacidad, forma, nombre }) => {
    const [r] = await pool.execute(
      `UPDATE mesas SET zona_id=?, capacidad=?, forma=?, nombre=? WHERE id=? AND restaurante_id=?`,
      [zona_id || null, capacidad || 4, forma || "cuadrada", nombre, id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  // Cada UPDATE del lote lleva su propio filtro de restaurante_id — si el
  // array trae un id que no pertenece a este tenant, esa fila simplemente
  // no se actualiza, en vez de fallar todo el lote o exponer datos ajenos.
  updatePosicionBatch: async (restaurante_id, posiciones) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const { id, pos_x, pos_y } of posiciones) {
        await conn.execute(
          "UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ? AND restaurante_id = ?",
          [pos_x, pos_y, id, restaurante_id]
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

  delete: async (id, restaurante_id) => {
    const [r] = await pool.execute(
      "UPDATE mesas SET activa = FALSE WHERE id = ? AND restaurante_id = ?",
      [id, restaurante_id]
    );
    return r.affectedRows > 0;
  },

  // Nuevo: usado por rutas públicas (pedidos.js) para buscar/crear mesa
  // por nombre DENTRO del restaurante correcto — sin esto, "Mesa 3" del
  // restaurante A colisionaría con "Mesa 3" del restaurante B.
  findByNombre: async (nombre, restaurante_id) => {
    const [r] = await pool.execute(
      "SELECT id FROM mesas WHERE nombre = ? AND restaurante_id = ? LIMIT 1",
      [nombre, restaurante_id]
    );
    return r[0] || null;
  },
};

module.exports = Mesa;