const { pool } = require("../config/db");

const Proveedor = {
  crear: async ({ restaurante_id, nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones }) => {
    const [r] = await pool.execute(
      `INSERT INTO proveedores (restaurante_id, nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurante_id, nombre, nit || null, telefono || null, correo || null, direccion || null, ciudad || null, categoria || null, observaciones || null]
    );
    return r.insertId;
  },

  getAll: async ({ restaurante_id, estado, categoria, busqueda }) => {
    let sql = "SELECT * FROM proveedores WHERE restaurante_id = ?";
    const params = [restaurante_id];

    if (estado)    { sql += " AND estado = ?"; params.push(estado); }
    if (categoria) { sql += " AND categoria = ?"; params.push(categoria); }
    if (busqueda)  { sql += " AND (nombre LIKE ? OR nit LIKE ?)"; params.push(`%${busqueda}%`, `%${busqueda}%`); }

    sql += " ORDER BY nombre ASC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  getById: async (id, restaurante_id) => {
    const [rows] = await pool.execute(
      "SELECT * FROM proveedores WHERE id = ? AND restaurante_id = ?",
      [id, restaurante_id]
    );
    return rows[0] || null;
  },

  actualizar: async (id, restaurante_id, { nombre, nit, telefono, correo, direccion, ciudad, categoria, observaciones }) => {
    await pool.execute(
      `UPDATE proveedores
       SET nombre = ?, nit = ?, telefono = ?, correo = ?, direccion = ?, ciudad = ?, categoria = ?, observaciones = ?
       WHERE id = ? AND restaurante_id = ?`,
      [nombre, nit || null, telefono || null, correo || null, direccion || null, ciudad || null, categoria || null, observaciones || null, id, restaurante_id]
    );
  },

  cambiarEstado: async (id, restaurante_id, estado) => {
    await pool.execute(
      "UPDATE proveedores SET estado = ? WHERE id = ? AND restaurante_id = ?",
      [estado, id, restaurante_id]
    );
  },

  eliminar: async (id, restaurante_id) => {
    await pool.execute("DELETE FROM proveedores WHERE id = ? AND restaurante_id = ?", [id, restaurante_id]);
  },

  tieneFacturas: async (id) => {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as total FROM facturas_proveedor WHERE proveedor_id = ?",
      [id]
    );
    return rows[0].total > 0;
  },
};

module.exports = Proveedor;