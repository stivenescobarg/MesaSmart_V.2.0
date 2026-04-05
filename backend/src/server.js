const express    = require('express');
const cors       = require('cors');
const connection = require('./config/db');

const app = express();

// ── CORS corregido para preflight ─────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── Rutas del menú (productos, categorías, opciones) ──────────────────────
const productosRoutes = require('./routes/productos');
app.use('/api/menu', productosRoutes);

// ── Crear usuario ─────────────────────────────────────────────────────────
app.post('/usuarios', (req, res) => {
  const { correo, contraseña, rol } = req.body;
  connection.query(
    'INSERT INTO usuarios (correo, contraseña, rol) VALUES (?, ?, ?)',
    [correo, contraseña, rol],
    (err) => {
      if (err) { console.error(err); return res.status(500).send('Error al guardar'); }
      res.send('Usuario guardado en BD');
    }
  );
});

// ── Quejas: guardar desde el cliente ─────────────────────────────────────
app.post('/api/quejas', (req, res) => {
  const { mesa, mensaje } = req.body;
  if (!mensaje?.trim()) return res.status(400).json({ error: "Mensaje requerido" });
  connection.query(
    'INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)',
    [mesa || 'Sin mesa', mensaje.trim()],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: "Error al guardar" }); }
      res.json({ ok: true });
    }
  );
});

// ── Quejas: leer desde el admin ───────────────────────────────────────────
app.get('/api/quejas', (req, res) => {
  connection.query('SELECT * FROM quejas ORDER BY fecha DESC', (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error" }); }
    res.json(rows);
  });
});

// ── Quejas: marcar como revisada ──────────────────────────────────────────
app.patch('/api/quejas/:id/estado', (req, res) => {
  const { estado } = req.body;
  connection.query(
    'UPDATE quejas SET estado = ? WHERE id = ?',
    [estado, req.params.id],
    (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: "Error" }); }
      res.json({ ok: true });
    }
  );
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log('🔥 Servidor corriendo en http://localhost:3000');
// backend/src/server.js
require("dotenv").config();
const app             = require("./app");
const { connectDB }   = require("./config/db");

connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(`🚀 Servidor MesaSmart corriendo en http://localhost:${PORT}`)
  );
});