const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería iniciar sesión con credenciales correctas', async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // User.findByEmail usa pool.execute, no pool.query
    pool.execute.mockResolvedValueOnce([
      [{ id: 1, correo: 'admin@test.com', password: hashedPassword, nombre: 'Admin', rol: 'admin', numero: 1 }]
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'admin@test.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('debería fallar con correo incorrecto', async () => {
    pool.execute.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'noexiste@test.com', password: 'admin123' });

    expect(res.status).toBe(401);
    expect(res.body.msg).toMatch(/credenciales/i);
  });

  it('debería fallar sin password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'admin@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/contraseña/i);
  });
});