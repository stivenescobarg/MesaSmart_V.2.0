// backend/src/app.js
const express = require("express");
const cors    = require("cors");

const authRoutes   = require("./routes/authRoutes");
const userRoutes   = require("./routes/admin/userRoutes");
const mesaRoutes   = require("./routes/admin/mesaRoutes");
const pedidoRoutes = require("./routes/admin/pedidoRoutes");
const cajaRoutes   = require("./routes/admin/cajaRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Rutas
app.use("/api/auth",    authRoutes);
app.use("/api/usuarios",userRoutes);
app.use("/api/mesas",   mesaRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/caja",    cajaRoutes);

// Health check
app.get("/api/ping", (_, res) => res.json({ ok: true, msg: "MesaSmart API activa" }));

module.exports = app;