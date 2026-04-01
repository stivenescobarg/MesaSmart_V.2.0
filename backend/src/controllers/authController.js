// backend/src/controllers/authController.js
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Sesion  = require("../models/Sesion");

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password)
      return res.status(400).json({ msg: "Correo y contraseña son requeridos." });

    const usuario = await User.findByEmail(correo);
    if (!usuario) return res.status(401).json({ msg: "Credenciales incorrectas." });

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ msg: "Credenciales incorrectas." });

    const ip  = req.headers["x-forwarded-for"] || req.ip || "desconocida";
    const jti = await Sesion.crear({
      usuario_id: usuario.id,
      ip,
      dispositivo: req.headers["user-agent"],
    });

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, jti },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      ok: true,
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, numero: usuario.numero },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ msg: "Error interno." });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.usuario?.jti) await Sesion.cerrar(req.usuario.jti);
    res.json({ ok: true, msg: "Sesión cerrada." });
  } catch (err) {
    res.status(500).json({ msg: "Error al cerrar sesión." });
  }
};

exports.me = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado." });
    res.json({ ok: true, usuario });
  } catch (err) {
    res.status(500).json({ msg: "Error interno." });
  }
};