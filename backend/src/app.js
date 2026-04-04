// backend/src/app.js — ACTUALIZADO
const express = require("express");
const cors    = require("cors");
const db      = require("./config/db");

// ── Rutas existentes ──────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/admin/userRoutes");
const mesaRoutes    = require("./routes/admin/mesaRoutes");
const pedidoRoutes  = require("./routes/admin/pedidoRoutes");
const cajaRoutes    = require("./routes/admin/cajaRoutes");
const metricaRoutes = require("./routes/admin/metricaRoutes");
const egresoRoutes  = require("./routes/admin/egresoRoutes");
const sesionRoutes  = require("./routes/admin/sesionRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ── Rutas existentes ──────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);

// ════════════════════════════════════════════════════════════════════════════
// GET /api/menu
// Devuelve todos los productos con opciones (acompañamientos) y adiciones
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/menu", async (req, res) => {
  try {
    const [productos] = await db.promise().query(`
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen,
        p.tiene_termino,
        c.nombre  AS categoria,
        sc.nombre AS subcategoria
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN subcategorias sc ON sc.id = p.subcategoria_id
      ORDER BY c.nombre, p.nombre
    `);

    if (!productos.length) return res.json([]);

    const ids = productos.map(p => p.id);

    const [opciones] = await db.promise().query(`
      SELECT po.producto_id, o.id, o.nombre, o.tipo, o.precio
      FROM productos_opciones po
      JOIN opciones o ON o.id = po.opcion_id
      WHERE po.producto_id IN (?)
    `, [ids]);

    const opcionesPorProducto  = {};
    const adicionesPorProducto = {};

    opciones.forEach(o => {
      if (o.tipo === "acompanamiento") {
        if (!opcionesPorProducto[o.producto_id])  opcionesPorProducto[o.producto_id]  = [];
        opcionesPorProducto[o.producto_id].push({ id: o.id, nombre: o.nombre, precio: o.precio });
      } else if (o.tipo === "adiccion") {
        if (!adicionesPorProducto[o.producto_id]) adicionesPorProducto[o.producto_id] = [];
        adicionesPorProducto[o.producto_id].push({ id: o.id, nombre: o.nombre, precio: o.precio });
      }
    });

    const resultado = productos.map(p => ({
      ...p,
      opciones:  opcionesPorProducto[p.id]  || [],
      adiciones: adicionesPorProducto[p.id] || [],
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Error GET /api/menu:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/quejas — guarda queja del cliente
// ════════════════════════════════════════════════════════════════════════════
app.post("/api/quejas", async (req, res) => {
  const { mesa, mensaje } = req.body;
  if (!mensaje?.trim()) return res.status(400).json({ error: "Mensaje requerido" });

  try {
    await db.promise().query(
      "INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)",
      [mesa || "Sin mesa", mensaje.trim()]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error POST /api/quejas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/quejas — panel del administrador
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/quejas", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM quejas ORDER BY fecha DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error GET /api/quejas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PATCH /api/quejas/:id/estado — marcar como revisada desde el admin
app.patch("/api/quejas/:id/estado", async (req, res) => {
  const { estado } = req.body;
  try {
    await db.promise().query(
      "UPDATE quejas SET estado = ? WHERE id = ?",
      [estado, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error PATCH /api/quejas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Rutas de productos originales (conservadas)
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) { console.error(err); res.status(500).send("Error en la consulta"); }
    else res.json(result);
  });
});

app.post("/api/productos", (req, res) => {
  const { nombre, precio } = req.body;
  db.query(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
    [nombre, precio],
    (err) => {
      if (err) { console.error(err); res.status(500).send("Error al insertar"); }
      else res.send("Producto agregado");
    }
  );
});
app.use("/api/auth",      authRoutes);
app.use("/api/usuarios",  userRoutes);
app.use("/api/mesas",     mesaRoutes);
app.use("/api/pedidos",   pedidoRoutes);
app.use("/api/caja",      cajaRoutes);
app.use("/api/metricas",  metricaRoutes);
app.use("/api/egresos",   egresoRoutes);
app.use("/api/sesiones",  sesionRoutes);

app.get("/api/ping", (_, res) => res.json({ ok: true, msg: "MesaSmart API activa" }));

module.exports = app;