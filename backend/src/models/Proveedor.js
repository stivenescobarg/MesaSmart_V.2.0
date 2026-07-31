// backend/src/models/Proveedor.js
const { pool } = require("../config/db");

const Proveedor = {
  // Crear proveedor
  crear: async ({ nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones }) => {
    const [r] = await pool.execute(
      `INSERT INTO proveedores (nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, nit || null, telefono || null, correo || null, direccion || null, ciudad || null, categoria || null, observaciones || null]
    );
    return r.insertId;
  },

  // Listar con filtros opcionales (estado, categoria, búsqueda por nombre/nit)
  getAll: async ({ estado, categoria, busqueda } = {}) => {
    let sql = "SELECT * FROM proveedores WHERE 1=1";
    const params = [];

    if (estado) {
      sql += " AND estado = ?";
      params.push(estado);
    }
    if (categoria) {
      sql += " AND categoria = ?";
      params.push(categoria);
    }
    if (busqueda) {
      sql += " AND (nombre LIKE ? OR nit LIKE ?)";
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    sql += " ORDER BY nombre ASC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await pool.execute("SELECT * FROM proveedores WHERE id = ?", [id]);
    return rows[0] || null;
  },

  actualizar: async (id, { nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones }) => {
    await pool.execute(
      `UPDATE proveedores
       SET nombre = ?, nit = ?, telefono = ?, correo = ?, direccion = ?, ciudad = ?, categoria = ?, observaciones = ?
       WHERE id = ?`,
      [nombre, nit || null, telefono || null, correo || null, direccion || null, ciudad || null, categoria || null, observaciones || null, id]
    );
  },

  cambiarEstado: async (id, estado) => {
    await pool.execute("UPDATE proveedores SET estado = ? WHERE id = ?", [estado, id]);
  },

  eliminar: async (id) => {
    await pool.execute("DELETE FROM proveedores WHERE id = ?", [id]);
  },

  // Para validar que no se elimine un proveedor con facturas asociadas
  tieneFacturas: async (id) => {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as total FROM facturas_proveedor WHERE proveedor_id = ?",
      [id]
    );
    return rows[0].total > 0;
  },
};

module.exports = Proveedor;
