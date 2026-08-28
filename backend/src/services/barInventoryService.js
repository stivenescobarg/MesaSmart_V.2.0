// backend/src/services/barInventoryService.js
const { pool } = require("../config/db");
const BarAuditLog = require("../models/BarAuditLog");

const barInventoryService = {
  async obtenerInventario(restaurante_id) {
    const [productos] = await pool.execute(
      `SELECT id, nombre, categoria, unidad, cantidad_actual, cantidad_minima, activo
       FROM stock_productos 
       WHERE restaurante_id = ? AND categoria = 'bar' AND activo = TRUE
       ORDER BY nombre ASC`,
      [restaurante_id]
    );

    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      cantidad_actual: parseFloat(p.cantidad_actual) || 0,
      cantidad_minima: parseFloat(p.cantidad_minima) || 0,
      unidad: p.unidad,
      bajo_stock: parseFloat(p.cantidad_actual) <= parseFloat(p.cantidad_minima),
    }));
  },

  async obtenerProducto(restaurante_id, producto_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM stock_productos WHERE id = ? AND restaurante_id = ? AND categoria = 'bar'`,
      [producto_id, restaurante_id]
    );

    if (rows.length === 0) return null;

    const p = rows[0];
    return {
      id: p.id,
      nombre: p.nombre,
      cantidad_actual: parseFloat(p.cantidad_actual) || 0,
      cantidad_minima: parseFloat(p.cantidad_minima) || 0,
      unidad: p.unidad,
      bajo_stock: parseFloat(p.cantidad_actual) <= parseFloat(p.cantidad_minima),
    };
  },

  async obtenerBajoStock(restaurante_id) {
    const [productos] = await pool.execute(
      `SELECT id, nombre, cantidad_actual, cantidad_minima, unidad
       FROM stock_productos 
       WHERE restaurante_id = ? AND categoria = 'bar' AND activo = TRUE AND cantidad_actual <= cantidad_minima
       ORDER BY cantidad_actual ASC`,
      [restaurante_id]
    );

    return productos;
  },

  async validarDisponibilidad(restaurante_id, producto_id, cantidad_requerida) {
    const producto = await this.obtenerProducto(restaurante_id, producto_id);

    if (!producto) {
      return { disponible: false, mensaje: "Producto no encontrado" };
    }

    if (producto.cantidad_actual < cantidad_requerida) {
      return {
        disponible: false,
        mensaje: `Stock insuficiente. Disponible: ${producto.cantidad_actual}${producto.unidad}, requerido: ${cantidad_requerida}${producto.unidad}`,
      };
    }

    return { disponible: true, mensaje: "OK" };
  },

  async reducirInventario(restaurante_id, producto_id, cantidad, razon, usuario_id, ip_address) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[producto]] = await conn.execute(
        `SELECT id, nombre, cantidad_actual, unidad FROM stock_productos 
         WHERE id = ? AND restaurante_id = ? FOR UPDATE`,
        [producto_id, restaurante_id]
      );

      if (!producto) {
        await conn.rollback();
        return { ok: false, error: "Producto no encontrado" };
      }

      const cantidadAntes = parseFloat(producto.cantidad_actual);
      const cantidadDespues = Math.max(0, cantidadAntes - cantidad);

      await conn.execute(
        `UPDATE stock_productos SET cantidad_actual = ? WHERE id = ? AND restaurante_id = ?`,
        [cantidadDespues, producto_id, restaurante_id]
      );

      await BarAuditLog.crear({
        restaurante_id,
        accion: razon,
        producto_id,
        cantidad_antes: cantidadAntes,
        cantidad_despues: cantidadDespues,
        cambio: -cantidad,
        usuario_id,
        descripcion: `${razon}: -${cantidad}${producto.unidad} de ${producto.nombre}`,
        ip_address,
      }, conn);

      await conn.commit();

      return {
        ok: true,
        cantidad_actual: cantidadDespues,
        mensaje: `Stock reducido. Nuevo saldo: ${cantidadDespues}${producto.unidad}`,
      };
    } catch (error) {
      await conn.rollback();
      return { ok: false, error: error.message };
    } finally {
      conn.release();
    }
  },

  async incrementarInventario(restaurante_id, producto_id, cantidad, razon, usuario_id, ip_address) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[producto]] = await conn.execute(
        `SELECT id, nombre, cantidad_actual, unidad FROM stock_productos 
         WHERE id = ? AND restaurante_id = ? FOR UPDATE`,
        [producto_id, restaurante_id]
      );

      if (!producto) {
        await conn.rollback();
        return { ok: false, error: "Producto no encontrado" };
      }

      const cantidadAntes = parseFloat(producto.cantidad_actual);
      const cantidadDespues = cantidadAntes + cantidad;

      await conn.execute(
        `UPDATE stock_productos SET cantidad_actual = ? WHERE id = ? AND restaurante_id = ?`,
        [cantidadDespues, producto_id, restaurante_id]
      );

      await BarAuditLog.crear({
        restaurante_id,
        accion: razon,
        producto_id,
        cantidad_antes: cantidadAntes,
        cantidad_despues: cantidadDespues,
        cambio: cantidad,
        usuario_id,
        descripcion: `${razon}: +${cantidad}${producto.unidad} de ${producto.nombre}`,
        ip_address,
      }, conn);

      await conn.commit();

      return {
        ok: true,
        cantidad_actual: cantidadDespues,
        mensaje: `Stock incrementado. Nuevo saldo: ${cantidadDespues}${producto.unidad}`,
      };
    } catch (error) {
      await conn.rollback();
      return { ok: false, error: error.message };
    } finally {
      conn.release();
    }
  },
};

module.exports = barInventoryService;