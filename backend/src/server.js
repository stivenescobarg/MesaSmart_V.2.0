require("dotenv").config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));

// ── Menú ──────────────────────────────────────────────────────────
app.use('/api/menu',    require('./routes/productos'));

// ── Admin ─────────────────────────────────────────────────────────
app.use('/api/mesas',    require('./routes/admin/mesaRoutes'));
app.use('/api/caja',     require('./routes/admin/cajaRoutes'));
app.use('/api/pedidos',  require('./routes/admin/pedidoRoutes'));
app.use('/api/usuarios', require('./routes/admin/userRoutes'));
app.use('/api/egresos',  require('./routes/admin/egresoRoutes'));
app.use('/api/sesiones', require('./routes/admin/sesionRoutes'));
app.use('/api/metricas', require('./routes/admin/metricaRoutes'));

app.listen(3001, () => {
  console.log('🔥 Servidor corriendo en http://localhost:3001');
});