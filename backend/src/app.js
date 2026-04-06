// backend/src/app.js
const express = require("express");
const cors    = require("cors");

// ── Rutas del admin (tuyas) ───────────────────────────────────────
const authRoutes    = require("./routes/authRoutes");
const userRoutes    = require("./routes/admin/userRoutes");
const mesaRoutes    = require("./routes/admin/mesaRoutes");
const pedidoRoutes  = require("./routes/admin/pedidoRoutes");
const cajaRoutes    = require("./routes/admin/cajaRoutes");
const metricaRoutes = require("./routes/admin/metricaRoutes");
const egresoRoutes  = require("./routes/admin/egresoRoutes");
const sesionRoutes  = require("./routes/admin/sesionRoutes");

// ── Rutas del menú (compañera) ────────────────────────────────────
const productosRoutes = require("./routes/productos");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ── RUTAS DEL ADMIN ───────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/usuarios",  userRoutes);
app.use("/api/mesas",     mesaRoutes);
app.use("/api/pedidos",   pedidoRoutes);
app.use("/api/caja",      cajaRoutes);
app.use("/api/metricas",  metricaRoutes);
app.use("/api/egresos",   egresoRoutes);
app.use("/api/sesiones",  sesionRoutes);

// ── RUTAS DEL MENÚ (compañera) ────────────────────────────────────
app.use("/api/menu", productosRoutes);

// ── QUEJAS (compañera) ────────────────────────────────────────────
// Estas rutas usan la conexión de la compañera (connection de db.js)
// Si tu db.js usa pool de mysql2, reemplaza connection.query por pool.execute
const { pool } = require("./config/db");

app.post("/api/quejas", async (req, res) => {
  const { mesa, mensaje } = req.body;
  if (!mensaje?.trim())
    return res.status(400).json({ error: "Mensaje requerido" });
  try {
    await pool.execute(
      "INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)",
      [mesa || "Sin mesa", mensaje.trim()]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[quejas/post]", err);
    res.status(500).json({ error: "Error al guardar" });
  }
});

app.get("/api/quejas", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM quejas ORDER BY fecha DESC");
    res.json(rows);
  } catch (err) {
    console.error("[quejas/get]", err);
    res.status(500).json({ error: "Error" });
  }
});

app.patch("/api/quejas/:id/estado", async (req, res) => {
  const { estado } = req.body;
  try {
    await pool.execute(
      "UPDATE quejas SET estado = ? WHERE id = ?",
      [estado, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[quejas/patch]", err);
    res.status(500).json({ error: "Error" });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────────
app.get("/api/ping", (_, res) =>
  res.json({ ok: true, msg: "MesaSmart API activa" })
);

module.exports = app;