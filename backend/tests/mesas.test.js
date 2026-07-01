const request = require('supertest');
const app = require('../src/app');

describe('POST /api/mesas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear una mesa (admin)', async () => {
    const res = await request(app)
      .post('/api/mesas')
      .send({ nombre: 'Mesa 99', zona_id: 1, capacidad: 4 }); // el controlador usa "nombre" y "zona_id", no "numero"/"zona"

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('debería fallar sin nombre', async () => {
    const res = await request(app)
      .post('/api/mesas')
      .send({ zona_id: 1, capacidad: 4 });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/nombre/i);
  });
});