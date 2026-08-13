const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");
const User        = require("../models/User");
const Sesion      = require("../models/Sesion");
const Restaurante = require("../models/Restaurante"); //  nuevo

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password)
      return res.status(400).json({ msg: "Correo y contraseña son requeridos." });

    const usuario = await User.findByEmail(correo);
    if (!usuario) return res.status(401).json({ msg: "Credenciales incorrectas." });

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(401).json({ msg: "Credenciales incorrectas." });

    // 👇 Bloqueo por estado del restaurante (no aplica al super_admin, que no tiene restaurante)
    if (usuario.rol !== "super_admin") {
      const restaurante = await Restaurante.getById(usuario.restaurante_id);
      if (!restaurante) {
        return res.status(403).json({ msg: "Tu restaurante no existe o fue eliminado." });
      }
      if (restaurante.estado === "pendiente") {
        return res.status(403).json({ msg: "Tu restaurante aún no ha sido activado. Contacta al administrador." });
      }
      if (restaurante.estado === "suspendido") {
        return res.status(403).json({ msg: "Tu cuenta está suspendida. Contacta a soporte." });
      }
    }

    const ip  = req.headers["x-forwarded-for"] || req.ip || "desconocida";
    const jti = await Sesion.crear({
      usuario_id: usuario.id,
      ip,
      dispositivo: req.headers["user-agent"],
    });

    const token = jwt.sign(
      { id: usuario.id, restaurante_id: usuario.restaurante_id, rol: usuario.rol, jti }, // 👈 restaurante_id agregado
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        restaurante_id: usuario.restaurante_id, // 👈
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        numero: usuario.numero,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ msg: "Error interno." });
  }
};

// logout y me quedan exactamente igual

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