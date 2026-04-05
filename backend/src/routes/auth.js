// backend/routes/auth.js
const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcrypt');
const connection = require('../config/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password)
    return res.status(400).json({ error: 'Faltan campos' });

  connection.query(
    'SELECT * FROM usuarios WHERE correo = ?',
    [correo],
    async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en BD' });

      if (results.length === 0)
        return res.status(401).json({ error: 'Usuario no encontrado' });

      const usuario = results[0];

      // ✅ Comparación bcrypt
      const passwordValida = await bcrypt.compare(password, usuario.password);
      if (!passwordValida)
        return res.status(401).json({ error: 'Contraseña incorrecta' });

      const token = Buffer.from(correo).toString('base64');

      res.json({
        ok: true,
        token,
        usuario: {
          id:     usuario.id,
          correo: usuario.correo,
          rol:    usuario.rol,
          numero: usuario.numero || 1,
        }
      });
    }
  );
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sin token' });

  const token  = auth.replace('Bearer ', '');
  const correo = Buffer.from(token, 'base64').toString('utf8');

  connection.query(
    'SELECT id, correo, rol, numero FROM usuarios WHERE correo = ?',
    [correo],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ error: 'Sesión inválida' });

      res.json({ usuario: results[0] });
    }
  );
});

module.exports = router;