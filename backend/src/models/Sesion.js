// backend/src/models/Sesion.js
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
  getActivas: async () => {
    const [r] = await pool.execute(
      `SELECT s.id,s.inicio,s.ip,u.correo,u.rol,u.nombre
       FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id
       WHERE s.activa=TRUE ORDER BY s.inicio DESC`);
    return r;
  },
  getHistorial: async () => {
    const [r] = await pool.execute(
      `SELECT s.id,s.inicio,s.fin,s.duracion_seg,u.correo,u.rol
       FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id
       WHERE s.activa=FALSE ORDER BY s.fin DESC LIMIT 100`);
    return r;
  },
  cerrarTodas: async (usuario_id) => {
    await pool.execute(
      `UPDATE sesiones SET activa=FALSE,fin=NOW(),
       duracion_seg=TIMESTAMPDIFF(SECOND,inicio,NOW())
       WHERE usuario_id=? AND activa=TRUE`, [usuario_id]);
  },
};

module.exports = Sesion;