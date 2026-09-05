const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const Sesion = {
  crear: async ({ usuario_id, ip, dispositivo }) => {
    const jti = uuidv4();
    await pool.execute(
      "INSERT INTO sesiones (usuario_id,token_jti,ip,dispositivo) VALUES (?,?,?,?)",
      [usuario_id, jti, ip || null, dispositivo?.slice(0,200) || null]);
    return jti;
  },

  cerrar: async (jti) => {
    await pool.execute(
      `UPDATE sesiones SET activa=FALSE, fin=NOW(),
       duracion_seg=TIMESTAMPDIFF(SECOND,inicio,NOW()) WHERE token_jti=?`, [jti]);
  },

  estaActiva: async (jti) => {
    const [r] = await pool.execute(
      "SELECT id FROM sesiones WHERE token_jti=? AND activa=TRUE LIMIT 1", [jti]);
    return r.length > 0;
  },

  // 👇 filtra por restaurante_id del usuario dueño de la sesión
  getActivas: async (restaurante_id) => {
    const [r] = await pool.execute(
      `SELECT s.id,s.inicio,s.ip,u.correo,u.rol,u.nombre
       FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id
       WHERE s.activa=TRUE AND u.restaurante_id=?
       ORDER BY s.inicio DESC`,
      [restaurante_id]);
    return r;
  },

  getHistorial: async (restaurante_id) => {
    const [r] = await pool.execute(
      `SELECT s.id,s.inicio,s.fin,s.duracion_seg,u.correo,u.rol
       FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id
       WHERE s.activa=FALSE AND u.restaurante_id=?
       ORDER BY s.fin DESC LIMIT 100`,
      [restaurante_id]);
    return r;
  },

  // 👇 exige restaurante_id y valida via JOIN antes de tocar la fila
  cerrarTodas: async (usuario_id, restaurante_id) => {
    const [r] = await pool.execute(
      `UPDATE sesiones s
       JOIN usuarios u ON u.id = s.usuario_id
       SET s.activa=FALSE, s.fin=NOW(),
           s.duracion_seg=TIMESTAMPDIFF(SECOND, s.inicio, NOW())
       WHERE s.usuario_id=? AND s.activa=TRUE AND u.restaurante_id=?`,
      [usuario_id, restaurante_id]);
    return r.affectedRows > 0;
  },
};

module.exports = Sesion;