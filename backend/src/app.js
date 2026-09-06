const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/admin/userRoutes");
const mesaRoutes = require("./routes/admin/mesaRoutes");
const zonaRoutes = require("./routes/admin/zonaRoutes");
const pedidoRoutes = require("./routes/admin/pedidoRoutes");
const cajaRoutes = require("./routes/admin/cajaRoutes");
const metricaRoutes = require("./routes/admin/metricaRoutes");
const egresoRoutes = require("./routes/admin/egresoRoutes");
const sesionRoutes = require("./routes/admin/sesionRoutes");
const stockRoutes = require("./routes/admin/stockRoutes");
const barRoutes = require("./routes/admin/barRoutes");
const productosRoutes = require("./routes/productos");
const uploadRoutes = require("./routes/upload");
const pedidosCocinaRoutes = require("./routes/pedidos");
const quejaRoutes = require("./routes/quejaRoutes");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const proveedorRoutes        = require("./routes/admin/proveedorRoutes");
const facturaProveedorRoutes = require("./routes/admin/facturaProveedorRoutes");
const dashboardFinancieroRoutes = require("./routes/admin/dashboardFinancieroRoutes");
const analiticaRoutes = require("./routes/admin/analiticaRoutes");
const superAdminRoutes = require("./routes/admin/superAdminRoutes");
const ingredienteRoutes = require("./routes/ingredienteRoutes");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());


// ─── Swagger UI ────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/mesas", mesaRoutes);
app.use("/api/zonas", zonaRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/pedidos-cocina", pedidosCocinaRoutes);
app.use("/api/caja", cajaRoutes);
app.use("/api/metricas", metricaRoutes);
app.use("/api/egresos", egresoRoutes);
app.use("/api/sesiones", sesionRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/bar", barRoutes);
app.use("/api/menu", productosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/quejas", quejaRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/facturas-proveedor", facturaProveedorRoutes);
app.use("/api/dashboard-financiero", dashboardFinancieroRoutes);
app.use("/api/analitica", analiticaRoutes);
app.use("/api/ingredientes", ingredienteRoutes);

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, msg: "MesaSmart API activa" });
});

module.exports = app;
