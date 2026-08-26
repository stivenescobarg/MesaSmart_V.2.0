// backend/src/controllers/admin/superAdminController.js
const ExcelJS      = require("exceljs");
const Restaurante       = require("../../models/Restaurante");
const PagoSuscripcion    = require("../../models/PagoSuscripcion");
const bcrypt      = require("bcryptjs");
const { pool }   = require("../../config/db");
const { invalidarCache } = require("../../middlewares/requierePlan");

const PLANES_VALIDOS = ["basico", "completo"];

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

    const planFinal = PLANES_VALIDOS.includes(plan) ? plan : "basico";

    const existente = await Restaurante.getBySlug(slug.trim());
    if (existente)
      return res.status(409).json({ msg: `El slug "${slug}" ya está en uso.` });

    await conn.beginTransaction();

    const [resResult] = await conn.execute(
      `INSERT INTO restaurantes (nombre, slug, estado, plan) VALUES (?, ?, 'pendiente', ?)`,
      [nombre.trim(), slug.trim(), planFinal]
    );
    const restaurante_id = resResult.insertId;

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
    invalidarCache(req.params.id);
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
    invalidarCache(req.params.id);
    res.json({ ok: true, msg: "Restaurante suspendido. Las sesiones activas expirarán en máximo 8h." });
  } catch (err) {
    console.error("[super-admin/suspender]", err);
    res.status(500).json({ msg: "Error al suspender restaurante." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/super-admin/restaurantes/:id
// ─────────────────────────────────────────────────────────────
exports.getDetalleRestaurante = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurante = await Restaurante.getById(id);
    if (!restaurante) return res.status(404).json({ msg: "Restaurante no encontrado." });

    const [adminRows] = await pool.execute(
      `SELECT id, nombre, correo, creado_en
       FROM usuarios
       WHERE restaurante_id = ? AND rol = 'admin'
       ORDER BY id ASC
       LIMIT 1`,
      [id]
    );
    const admin = adminRows[0] || null;

    const ultimoPago = await PagoSuscripcion.getUltimo(id);
    const pagos       = await PagoSuscripcion.getByRestaurante(id);

    const hoy = new Date().toISOString().split("T")[0];
    let estadoPago = "sin_pagos";
    if (ultimoPago) {
      const cubreHoy = ultimoPago.periodo_hasta >= hoy;
      estadoPago = cubreHoy ? "al_dia" : "vencido";
    }

    res.json({
      ok: true,
      restaurante,
      admin,
      pago: { estado: estadoPago, ultimo: ultimoPago, historial: pagos },
    });
  } catch (err) {
    console.error("[super-admin/getDetalleRestaurante]", err);
    res.status(500).json({ msg: "Error al obtener el detalle del restaurante." });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/super-admin/restaurantes/:id/pagos
// ─────────────────────────────────────────────────────────────
exports.registrarPagoSuscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, periodo_desde, periodo_hasta, fecha_pago, metodo_pago, notas } = req.body;

    if (!monto || monto <= 0)
      return res.status(400).json({ msg: "El monto debe ser mayor a 0." });
    if (!periodo_desde || !periodo_hasta)
      return res.status(400).json({ msg: "El período que cubre el pago es requerido." });
    if (periodo_hasta < periodo_desde)
      return res.status(400).json({ msg: "'Periodo hasta' no puede ser anterior a 'Periodo desde'." });

    const restaurante = await Restaurante.getById(id);
    if (!restaurante) return res.status(404).json({ msg: "Restaurante no encontrado." });

    const pagoId = await PagoSuscripcion.crear({
      restaurante_id: id,
      monto: parseFloat(monto),
      periodo_desde,
      periodo_hasta,
      fecha_pago: fecha_pago || new Date().toISOString().split("T")[0],
      metodo_pago,
      notas,
      registrado_por: req.usuario.id,
    });

    res.status(201).json({ ok: true, id: pagoId });
  } catch (err) {
    console.error("[super-admin/registrarPagoSuscripcion]", err);
    res.status(500).json({ msg: "Error al registrar el pago." });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/super-admin/restaurantes/:id/plan
// Cambia el plan de un restaurante ya existente (upgrade o downgrade).
// Invalida el cache de requierePlan para que el cambio aplique al instante.
// ─────────────────────────────────────────────────────────────
exports.cambiarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!PLANES_VALIDOS.includes(plan))
      return res.status(400).json({ msg: "Plan inválido. Debe ser 'basico' o 'completo'." });

    const restaurante = await Restaurante.getById(id);
    if (!restaurante) return res.status(404).json({ msg: "Restaurante no encontrado." });

    if (restaurante.plan === plan)
      return res.status(409).json({ msg: `El restaurante ya tiene el plan ${plan === "completo" ? "Completo" : "Básico"}.` });

    await pool.execute(`UPDATE restaurantes SET plan = ? WHERE id = ?`, [plan, id]);
    invalidarCache(id);

    res.json({ ok: true, msg: `Plan actualizado a ${plan === "completo" ? "Completo" : "Básico"}.` });
  } catch (err) {
    console.error("[super-admin/cambiarPlan]", err);
    res.status(500).json({ msg: "Error al cambiar el plan." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/super-admin/restaurantes/exportar-excel
// Excel con 2 hojas: Restaurantes (todos) y Historial de pagos (todos,
// de todos los restaurantes, con el nombre del restaurante en cada fila).
// ─────────────────────────────────────────────────────────────
exports.exportarExcel = async (req, res) => {
  try {
    const restaurantes = await Restaurante.listar();

    const [pagos] = await pool.execute(
      `SELECT p.id, r.nombre AS restaurante_nombre, p.periodo_desde, p.periodo_hasta,
              p.fecha_pago, p.metodo_pago, p.monto, p.notas
       FROM pagos_suscripcion p
       JOIN restaurantes r ON r.id = p.restaurante_id
       ORDER BY p.fecha_pago DESC, p.id DESC`
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = "MesaSmart Super Admin";
    wb.created = new Date();

    // ---- Hoja Restaurantes ----
    const hRest = wb.addWorksheet("Restaurantes");
    hRest.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nombre", key: "nombre", width: 28 },
      { header: "Slug", key: "slug", width: 22 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Plan", key: "plan", width: 12 },
      { header: "Usuarios", key: "total_usuarios", width: 10 },
      { header: "Creado", key: "creado_en", width: 16 },
      { header: "Activado", key: "activado_en", width: 16 },
    ];
    hRest.addRows(restaurantes.map(r => ({
      id: r.id,
      nombre: r.nombre,
      slug: r.slug,
      estado: r.estado,
      plan: r.plan,
      total_usuarios: r.total_usuarios,
      creado_en: r.creado_en ? new Date(r.creado_en).toLocaleDateString("es-CO") : "",
      activado_en: r.activado_en ? new Date(r.activado_en).toLocaleDateString("es-CO") : "",
    })));
    hRest.getRow(1).font = { bold: true };

    // ---- Hoja Historial de pagos ----
    const hPagos = wb.addWorksheet("Historial de pagos");
    hPagos.columns = [
      { header: "Restaurante", key: "restaurante_nombre", width: 26 },
      { header: "Periodo desde", key: "periodo_desde", width: 14 },
      { header: "Periodo hasta", key: "periodo_hasta", width: 14 },
      { header: "Fecha de pago", key: "fecha_pago", width: 14 },
      { header: "Método", key: "metodo_pago", width: 14 },
      { header: "Monto", key: "monto", width: 14, style: { numFmt: '"$"#,##0' } },
      { header: "Notas", key: "notas", width: 30 },
    ];
    hPagos.addRows(pagos);
    hPagos.getRow(1).font = { bold: true };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=mesasmart_restaurantes_${new Date().toISOString().split("T")[0]}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[super-admin/exportarExcel]", err);
    res.status(500).json({ msg: "Error al generar el Excel." });
  }
};