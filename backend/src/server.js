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
app.use('/api/auth',    require('./routes/authRoutes'));

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
app.use('/api/bar',      require('./routes/admin/barRoutes'));

// ── Quejas ────────────────────────────────────────────────────────
const { pool } = require('./config/db');

app.post('/api/quejas', async (req, res) => {
  const { mesa, mensaje } = req.body;
  if (!mensaje?.trim()) return res.status(400).json({ error: "Mensaje requerido" });
  try {
    await pool.execute('INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)', [mesa || 'Sin mesa', mensaje.trim()]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Error al guardar" }); }
});

app.get('/api/quejas', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM quejas ORDER BY fecha DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.patch('/api/quejas/:id/estado', async (req, res) => {
  try {
    await pool.execute('UPDATE quejas SET estado = ? WHERE id = ?', [req.body.estado, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.listen(3001, () => console.log('🔥 Servidor corriendo en http://localhost:3001'));
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
