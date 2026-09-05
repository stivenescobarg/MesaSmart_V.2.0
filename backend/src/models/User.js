// backend/src/models/User.js
const { pool } = require("../config/db");

const User = {
  findByEmail: async (correo) => {
    const [r] = await pool.execute(
      "SELECT * FROM usuarios WHERE correo=? AND activo=TRUE LIMIT 1", [correo]);
    return r[0] || null;
  },

  findById: async (id) => {
    const [r] = await pool.execute(
      "SELECT id,nombre,correo,rol,numero,restaurante_id,creado_en FROM usuarios WHERE id=? AND activo=TRUE LIMIT 1", [id]);
    return r[0] || null;
  },

  // 👇 ahora exige restaurante_id, ya no expone usuarios de otros tenants
  findAll: async (restaurante_id) => {
    const [r] = await pool.execute(
      "SELECT id,nombre,correo,rol,numero,restaurante_id,activo,creado_en FROM usuarios WHERE restaurante_id=? ORDER BY creado_en DESC",
      [restaurante_id]);
    return r;
  },

  create: async ({ nombre, correo, correo_personal, telefono, password, rol, numero, restaurante_id }) => {
    const [r] = await pool.execute(
      "INSERT INTO usuarios (nombre,correo,correo_personal,telefono,password,rol,numero,restaurante_id) VALUES (?,?,?,?,?,?,?,?)",
      [nombre, correo, correo_personal, telefono, password, rol, numero, restaurante_id]);
    return r.insertId;
  },

  // 👇 valida que el usuario pertenezca al tenant antes de desactivar
  delete: async (id, restaurante_id) => {
    const [r] = await pool.execute(
      "UPDATE usuarios SET activo=FALSE WHERE id=? AND restaurante_id=?",
      [id, restaurante_id]);
    return r.affectedRows > 0;
  },

  // 👇 el correlativo (numero) ahora se calcula solo dentro del tenant
  countByRol: async (rol, restaurante_id) => {
    const [r] = await pool.execute(
      "SELECT COUNT(*) as total FROM usuarios WHERE rol=? AND restaurante_id=?",
      [rol, restaurante_id]);
    return r[0].total;
  },
};

module.exports = User;