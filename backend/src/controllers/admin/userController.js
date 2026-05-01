// backend/src/controllers/admin/userController.js
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
    const { nombre, correo, password, rol } = req.body;
    if (!correo || !password || !rol)
      return res.status(400).json({ msg: "Faltan campos." });
    const hash   = await bcrypt.hash(password, 10);
    const numero = (await User.countByRol(rol)) + 1;
    const id     = await User.create({
      nombre: nombre || correo.split("@")[0], correo, password: hash, rol, numero,
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