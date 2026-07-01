const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/pedidos-cocina', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear un nuevo pedido', async () => {
    // Mock de getConnection
    const mockConn = {
      query: jest.fn().mockResolvedValue([[], []]),
      execute: jest.fn().mockResolvedValue([{ insertId: 123 }]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    pool.getConnection.mockResolvedValue(mockConn);

    // Mock de pool.query por si se usa en el POST (aunque no debería)
    pool.query.mockResolvedValue([[], []]);

    const res = await request(app)
      .post('/api/pedidos-cocina')
      .send({
        mesa_nombre: 'Mesa 5',
        items: [
          { nombre: 'Hamburguesa', cantidad: 2, precio: 12.50 },
          { nombre: 'Papas fritas', cantidad: 1, precio: 4.00 }
        ],
        observacion: 'Sin cebolla'
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.pedido_id).toBe(123);
  });

  it('debería fallar sin items', async () => {
    // Mock de getConnection por si se llama
    pool.getConnection.mockResolvedValue({
      query: jest.fn().mockResolvedValue([[], []]),
      execute: jest.fn().mockResolvedValue([{ insertId: 1 }]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    });

    const res = await request(app)
      .post('/api/pedidos-cocina')
      .send({ mesa_nombre: 'Mesa 5' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/items/i);
  });
});