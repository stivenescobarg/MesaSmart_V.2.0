const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/caja/abrir', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería abrir la caja (admin)', async () => {
    // Caja.getAbierta() y Caja.abrir() usan pool.execute, no pool.query
    pool.execute.mockResolvedValueOnce([[]]);              // sin caja abierta
    pool.execute.mockResolvedValueOnce([{ insertId: 1 }]); // INSERT INTO caja

    const res = await request(app)
      .post('/api/caja/abrir')
      .send({ monto_inicial: 50000 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('debería fallar si ya hay una caja abierta', async () => {
    pool.execute.mockResolvedValueOnce([[{ id: 1, estado: 'abierta' }]]);

    const res = await request(app)
      .post('/api/caja/abrir')
      .send({ monto_inicial: 50000 });

    expect(res.status).toBe(409);
    expect(res.body.msg).toMatch(/ya hay una caja/i);
  });
});