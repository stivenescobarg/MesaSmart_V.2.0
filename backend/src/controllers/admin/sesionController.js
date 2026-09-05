// backend/src/controllers/admin/sesionController.js
const Sesion = require("../../models/Sesion");
const User   = require("../../models/User");

exports.getSesiones = async (req, res) => {
  try {
    const activas   = await Sesion.getActivas(req.restaurante_id);
    const historial = await Sesion.getHistorial(req.restaurante_id);
    res.json({ ok: true, activas, historial });
  } catch { res.status(500).json({ msg: "Error al obtener sesiones." }); }
};


exports.forzarLogout = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    
    if (parseInt(usuario_id) === req.usuario.id)
      return res.status(400).json({ msg: "No puedes cerrar tu propia sesión desde aquí." });

    // 👇 cerrarTodas ahora valida por sí mismo que el usuario sea del mismo tenant
    const cerrada = await Sesion.cerrarTodas(usuario_id, req.restaurante_id);
    if (!cerrada)
      return res.status(404).json({ msg: "Usuario no encontrado o sin sesión activa." });

    res.json({ ok: true, msg: "Sesión cerrada forzosamente." });
  } catch { res.status(500).json({ msg: "Error al forzar cierre de sesión." }); }
};