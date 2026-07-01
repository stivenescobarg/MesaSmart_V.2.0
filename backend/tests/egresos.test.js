const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/egresos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear un egreso', async () => {
    // Caja.getAbierta() usa pool.execute, no pool.query
    pool.execute.mockResolvedValueOnce([[{ id: 1, estado: 'abierta' }]]);
    // Insert del egreso (asumiendo que Egreso.crear también usa pool.execute, mismo patrón que Caja/User)
    pool.execute.mockResolvedValueOnce([{ insertId: 10 }]);

    const res = await request(app)
      .post('/api/egresos')
      .send({ descripcion: 'Compra de insumos', monto: 15000 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 10);
  });

  it('debería fallar si no hay caja abierta', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // Caja.getAbierta() devuelve null

    const res = await request(app)
      .post('/api/egresos')
      .send({ descripcion: 'Compra de insumos', monto: 15000 });

    expect(res.status).toBe(409);
    expect(res.body.msg).toMatch(/no hay caja abierta/i);
  });
});