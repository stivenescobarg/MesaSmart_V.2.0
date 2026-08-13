const Restaurante = require("../../models/Restaurante");
const bcrypt      = require("bcryptjs");
const { pool }   = require("../../config/db");

exports.listarRestaurantes = async (_req, res) => {
  try {
    const restaurantes = await Restaurante.listar();
    res.json({ ok: true, restaurantes });
  } catch (err) {
    console.error("[super-admin/listar]", err);
    res.status(500).json({ msg: "Error al obtener restaurantes." });
  }
};

exports.crearRestaurante = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nombre, slug, plan, admin_nombre, admin_correo, admin_password } = req.body;

    if (!nombre?.trim() || !slug?.trim())
      return res.status(400).json({ msg: "Nombre y slug son requeridos." });
    if (!admin_nombre?.trim() || !admin_correo?.trim() || !admin_password?.trim())
      return res.status(400).json({ msg: "Datos del admin del restaurante son requeridos." });

    // Verificar que el slug no exista ya
    const existente = await Restaurante.getBySlug(slug.trim());
    if (existente)
      return res.status(409).json({ msg: `El slug "${slug}" ya está en uso.` });

    await conn.beginTransaction();

    // Crear restaurante en estado 'pendiente' — activar por separado
    const [resResult] = await conn.execute(
      `INSERT INTO restaurantes (nombre, slug, estado, plan) VALUES (?, ?, 'pendiente', ?)`,
      [nombre.trim(), slug.trim(), plan || null]
    );
    const restaurante_id = resResult.insertId;

    // Crear el usuario admin del restaurante
    const hash = await bcrypt.hash(admin_password, 10);
    await conn.execute(
      `INSERT INTO usuarios (restaurante_id, nombre, correo, password, rol, numero)
       VALUES (?, ?, ?, ?, 'admin', 1)`,
      [restaurante_id, admin_nombre.trim(), admin_correo.trim(), hash]
    );

    await conn.commit();
    res.status(201).json({ ok: true, id: restaurante_id });
  } catch (err) {
    await conn.rollback();
    console.error("[super-admin/crear]", err);
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ msg: "El correo del admin ya está en uso." });
    res.status(500).json({ msg: "Error al crear restaurante." });
  } finally {
    conn.release();
  }
};

exports.activarRestaurante = async (req, res) => {
  try {
    const ok = await Restaurante.activar(req.params.id);
    if (!ok) return res.status(404).json({ msg: "Restaurante no encontrado o ya estaba activo." });
    res.json({ ok: true, msg: "Restaurante activado correctamente." });
  } catch (err) {
    console.error("[super-admin/activar]", err);
    res.status(500).json({ msg: "Error al activar restaurante." });
  }
};

exports.suspenderRestaurante = async (req, res) => {
  try {
    const ok = await Restaurante.suspender(req.params.id);
    if (!ok) return res.status(404).json({ msg: "Restaurante no encontrado o no estaba activo." });
    res.json({ ok: true, msg: "Restaurante suspendido. Las sesiones activas expirarán en máximo 8h." });
  } catch (err) {
    console.error("[super-admin/suspender]", err);
    res.status(500).json({ msg: "Error al suspender restaurante." });
  }
};