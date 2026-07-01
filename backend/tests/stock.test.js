const request = require('supertest');
const app = require('../src/app');

describe('POST /api/stock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear un producto en stock (admin)', async () => {
    const res = await request(app)
      .post('/api/stock')
      .send({
        nombre: 'Leche',
        proveedor: 'Distribuidora XYZ', // requerido por el controlador, faltaba en el test original
        categoria: 'Lácteos',
        unidad: 'litro',
        cantidad_actual: 10,
        cantidad_minima: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('debería fallar sin proveedor', async () => {
    const res = await request(app)
      .post('/api/stock')
      .send({ nombre: 'Leche', categoria: 'Lácteos' });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/proveedor/i);
  });
});