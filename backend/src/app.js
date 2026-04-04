// backend/src/app.js — ACTUALIZADO
const express = require("express");
const cors    = require("cors");

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