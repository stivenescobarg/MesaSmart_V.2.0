const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/zonas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear una zona (admin)', async () => {
    // Verificar que no existe zona con ese nombre
    pool.query.mockResolvedValueOnce([[]]);
    pool.execute.mockResolvedValueOnce([{ insertId: 3 }]);

    const res = await request(app)
      .post('/api/zonas')
      .send({ nombre: 'Terraza', descripcion: 'Zona exterior' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 3);
  });
});