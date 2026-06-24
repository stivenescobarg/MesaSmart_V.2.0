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
      "SELECT id,nombre,correo,rol,numero,creado_en FROM usuarios WHERE id=? AND activo=TRUE LIMIT 1", [id]);
    return r[0] || null;
  },
  findAll: async () => {
    const [r] = await pool.execute(
      "SELECT id,nombre,correo,rol,numero,activo,creado_en FROM usuarios ORDER BY creado_en DESC");
    return r;
  },
  create: async ({ nombre, correo, password, rol, numero }) => {
    const [r] = await pool.execute(
      "INSERT INTO usuarios (nombre,correo,password,rol,numero) VALUES (?,?,?,?,?)",
      [nombre, correo, password, rol, numero]);
    return r.insertId;
  },
  delete: async (id) => {
    await pool.execute("UPDATE usuarios SET activo=FALSE WHERE id=?", [id]);
  },
  countByRol: async (rol) => {
    const [r] = await pool.execute(
      "SELECT COUNT(*) as total FROM usuarios WHERE rol=?", [rol]);
    return r[0].total;
  },
};

module.exports = User;