const bcrypt = require("bcryptjs");
const User   = require("../../models/User");
const Sesion = require("../../models/Sesion");

exports.getAll = async (req, res) => {
  try {
    res.json({ ok: true, usuarios: await User.findAll() });
  } catch { res.status(500).json({ msg: "Error al obtener usuarios." }); }
};

exports.create = async (req, res) => {
  try {
    const { nombre, correo, correo_personal, telefono, password, rol } = req.body;

    if (!nombre?.trim() || !correo || !correo_personal || !telefono || !password || !rol)
      return res.status(400).json({ msg: "Faltan campos." });

    if (!/^\S+@\S+\.\S+$/.test(correo))
      return res.status(400).json({ msg: "El correo del sistema no tiene un formato válido." });

    if (!/^\S+@\S+\.\S+$/.test(correo_personal))
      return res.status(400).json({ msg: "El correo personal no tiene un formato válido." });

    if (!/^\d{7,15}$/.test(telefono))
      return res.status(400).json({ msg: "El número de teléfono no es válido." });

    if (password.length < 6)
      return res.status(400).json({ msg: "La contraseña debe tener al menos 6 caracteres." });

    const hash   = await bcrypt.hash(password, 10);
    const numero = (await User.countByRol(rol)) + 1;

    const id = await User.create({
      restaurante_id: req.usuario?.restaurante_id, // ajusta si tu middleware lo expone distinto
      nombre: nombre.trim(),
      correo,
      correo_personal,
      telefono,
      password: hash,
      rol,
      numero,
    });

    res.status(201).json({ ok: true, id });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ msg: "El correo ya está registrado." });
    res.status(500).json({ msg: "Error al crear usuario." });
  }
};

exports.remove = async (req, res) => {
  try {
    await Sesion.cerrarTodas(req.params.id);
    await User.delete(req.params.id);
    res.json({ ok: true });
  } catch { res.status(500).json({ msg: "Error al eliminar usuario." }); }
};

exports.getSesiones = async (req, res) => {
  try {
    res.json({ ok: true, activas: await Sesion.getActivas(), historial: await Sesion.getHistorial() });
  } catch { res.status(500).json({ msg: "Error al obtener sesiones." }); }
};