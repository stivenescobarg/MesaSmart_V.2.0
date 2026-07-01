const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear un producto (admin)', async () => {
    const mockConn = {
      query: jest.fn().mockResolvedValue([[], []]),
      execute: jest.fn().mockResolvedValue([{ insertId: 100 }]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    pool.getConnection.mockResolvedValue(mockConn);

    const res = await request(app)
      .post('/api/menu')
      .send({ nombre: 'Pizza', precio: 15.00, categoria_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });
});