// backend/src/controllers/admin/sesionController.js
const Sesion = require("../../models/Sesion");
const User   = require("../../models/User");

exports.getSesiones = async (req, res) => {
  try {
    const activas   = await Sesion.getActivas();
    const historial = await Sesion.getHistorial();
    res.json({ ok: true, activas, historial });
  } catch { res.status(500).json({ msg: "Error al obtener sesiones." }); }
};

// Forzar cierre de sesión de un usuario específico
exports.forzarLogout = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    // No permitir que el admin se expulse a sí mismo
    if (parseInt(usuario_id) === req.usuario.id)
      return res.status(400).json({ msg: "No puedes cerrar tu propia sesión desde aquí." });

    await Sesion.cerrarTodas(usuario_id);
    res.json({ ok: true, msg: "Sesión cerrada forzosamente." });
  } catch { res.status(500).json({ msg: "Error al forzar cierre de sesión." }); }
};