// backend/src/app.js
const express = require("express");
const cors    = require("cors");

const authRoutes       = require("./routes/authRoutes");
const userRoutes       = require("./routes/admin/userRoutes");
const mesaRoutes       = require("./routes/admin/mesaRoutes");
const zonaRoutes       = require("./routes/admin/zonaRoutes");
const pedidoRoutes     = require("./routes/admin/pedidoRoutes");
const cajaRoutes       = require("./routes/admin/cajaRoutes");
const metricaRoutes    = require("./routes/admin/metricaRoutes");
const egresoRoutes     = require("./routes/admin/egresoRoutes");
const sesionRoutes     = require("./routes/admin/sesionRoutes");
const stockRoutes      = require("./routes/admin/stockRoutes");
const productosRoutes  = require("./routes/productos");
const pedidosCocinaRoutes = require("./routes/pedidos"); // ← ruta del panel cocina
const { pool } = require("./config/db");



const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

app.use("/api/auth",           authRoutes);
app.use("/api/usuarios",       userRoutes);
app.use("/api/mesas",          mesaRoutes);
app.use("/api/zonas",          zonaRoutes);
app.use("/api/pedidos",        pedidoRoutes);
app.use("/api/pedidos-cocina", pedidosCocinaRoutes); // ← panel cocina
app.use("/api/caja",           cajaRoutes);
app.use("/api/metricas",       metricaRoutes);
app.use("/api/egresos",        egresoRoutes);
app.use("/api/sesiones",       sesionRoutes);
app.use("/api/stock",          stockRoutes);
app.use("/api/menu",           productosRoutes);

// Quejas
app.post("/api/quejas", async (req, res) => {
  const { mesa, mensaje } = req.body;
  if (!mensaje?.trim()) return res.status(400).json({ error: "Mensaje requerido" });
  try {
    await pool.execute("INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)", [mesa || "Sin mesa", mensaje.trim()]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Error al guardar" }); }
});

app.get("/api/quejas", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM quejas ORDER BY fecha DESC");
    res.json(rows);
  } catch { res.status(500).json({ error: "Error" }); }
});

app.patch("/api/quejas/:id/estado", async (req, res) => {
  try {
    await pool.execute("UPDATE quejas SET estado = ? WHERE id = ?", [req.body.estado, req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Error" }); }
});

app.get("/api/ping", (_, res) => res.json({ ok: true, msg: "MesaSmart API activa" }));

module.exports = app;