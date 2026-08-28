// backend/src/services/barOrderService.js
const { pool } = require("../config/db");
const BarAuditLog = require("../models/BarAuditLog");

const barOrderService = {
  async crear({ restaurante_id, mesa, items, observacion, usuario_id, ip_address }) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (!restaurante_id) {
        await conn.rollback();
        return { ok: false, error: "No se pudo determinar el restaurante." };
      }

      if (!Array.isArray(items) || items.length === 0) {
        await conn.rollback();
        return { ok: false, error: "La orden debe contener al menos un item" };
      }

      const [productos] = await conn.execute(
        `SELECT id, nombre, cantidad_actual, cantidad_minima, categoria, unidad 
         FROM stock_productos 
         WHERE restaurante_id = ? AND activo = TRUE AND categoria = 'bar'`,
        [restaurante_id]
      );

      const productoMap = new Map(
        productos.map((p) => [p.nombre.toLowerCase(), p])
      );

      for (const item of items) {
        const producto = productoMap.get(item.nombre.toLowerCase());

        if (!producto) {
          await conn.rollback();
          return {
            ok: false,
            error: `Producto "${item.nombre}" no encontrado en inventario del bar`,
          };
        }

        const cantidad = Number(item.cantidad) || 1;
        if (cantidad <= 0) {
          await conn.rollback();
          return { ok: false, error: "Cantidad debe ser mayor a 0" };
        }

        if (producto.cantidad_actual < cantidad) {
          await conn.rollback();
          return {
            ok: false,
            error: `Stock insuficiente de "${item.nombre}". Disponible: ${producto.cantidad_actual}, solicitado: ${cantidad}`,
          };
        }
      }

      const [ordenResult] = await conn.execute(
        `INSERT INTO ordenes_bar (restaurante_id, mesa, items, observacion, usuario_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          restaurante_id,
          mesa.trim(),
          JSON.stringify(items),
          observacion || null,
          usuario_id || null,
        ]
      );

      const ordenId = ordenResult.insertId;

      for (const item of items) {
        const producto = productoMap.get(item.nombre.toLowerCase());
        const cantidad = Number(item.cantidad) || 1;
        const cantidadAntes = producto.cantidad_actual;
        const cantidadDespues = cantidadAntes - cantidad;

        await conn.execute(
          `UPDATE stock_productos 
           SET cantidad_actual = cantidad_actual - ? 
           WHERE id = ? AND restaurante_id = ?`,
          [cantidad, producto.id, restaurante_id]
        );

        await BarAuditLog.crear({
          restaurante_id,
          accion: "orden_creada",
          producto_id: producto.id,
          orden_id: ordenId,
          cantidad_antes: cantidadAntes,
          cantidad_despues: cantidadDespues,
          cambio: -cantidad,
          usuario_id,
          descripcion: `Orden #${ordenId}: ${cantidad} x ${item.nombre}`,
          ip_address,
        }, conn);
      }

      await conn.commit();

      return {
        ok: true,
        id: ordenId,
        mensaje: `Orden #${ordenId} creada. Stock actualizado automáticamente.`,
      };
    } catch (error) {
      await conn.rollback();
      return {
        ok: false,
        error: error.message || "Error al crear la orden",
      };
    } finally {
      conn.release();
    }
  },

  async actualizarEstado(id, restaurante_id, estado, usuario_id, ip_address) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (!restaurante_id) {
        await conn.rollback();
        return { ok: false, error: "No se pudo determinar el restaurante.", status: 400 };
      }

      const [[orden]] = await conn.execute(
        `SELECT id, estado FROM ordenes_bar WHERE id = ? AND restaurante_id = ? FOR UPDATE`,
        [id, restaurante_id]
      );

      if (!orden) {
        await conn.rollback();
        return { ok: false, error: "Orden no encontrada", status: 404 };
      }

      const transiciones = {
        pendiente: ["en_preparacion", "cancelado"],
        en_preparacion: ["listo", "cancelado"],
        listo: [],
        cancelado: [],
      };

      if (!transiciones[orden.estado]?.includes(estado)) {
        await conn.rollback();
        return {
          ok: false,
          error: `No se puede cambiar de ${orden.estado} a ${estado}`,
          status: 409,
        };
      }

      const camposFecha =
        estado === "en_preparacion"
          ? ", iniciado_en = COALESCE(iniciado_en, NOW())"
          : estado === "listo"
          ? ", listo_en = NOW()"
          : "";

      await conn.execute(
        `UPDATE ordenes_bar SET estado = ?${camposFecha} WHERE id = ? AND restaurante_id = ?`,
        [estado, id, restaurante_id]
      );

      await BarAuditLog.crear({
        restaurante_id,
        accion: "cambio_estado",
        orden_id: id,
        usuario_id,
        descripcion: `Orden #${id} cambió de ${orden.estado} a ${estado}`,
        ip_address,
      }, conn);

      await conn.commit();

      return {
        ok: true,
        id: Number(id),
        estado,
        mensaje: `Estado actualizado a ${estado}`,
      };
    } catch (error) {
      await conn.rollback();
      return {
        ok: false,
        error: error.message || "Error al actualizar estado",
      };
    } finally {
      conn.release();
    }
  },
};

module.exports = barOrderService;