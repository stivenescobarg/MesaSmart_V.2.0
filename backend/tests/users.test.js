const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('POST /api/usuarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería crear un nuevo usuario (admin)', async () => {
    // User.countByRol usa pool.execute → SELECT COUNT(*) as total
    pool.execute.mockResolvedValueOnce([[{ total: 0 }]]);
    // User.create usa pool.execute → INSERT
    pool.execute.mockResolvedValueOnce([{ insertId: 99 }]);

    const res = await request(app)
      .post('/api/usuarios')
      .send({
        nombre: 'Test User',
        correo: 'test@test.com', // userController usa "correo", no "email"
        password: 'test123',
        rol: 'mesero'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 99);
  });

  it('debería fallar si el correo ya existe', async () => {
    pool.execute.mockResolvedValueOnce([[{ total: 0 }]]); // countByRol
    const dupError = new Error('Duplicate entry');
    dupError.code = 'ER_DUP_ENTRY';
    pool.execute.mockRejectedValueOnce(dupError); // el INSERT falla por la constraint UNIQUE

    const res = await request(app)
      .post('/api/usuarios')
      .send({
        nombre: 'Test',
        correo: 'existente@test.com',
        password: 'test123',
        rol: 'mesero'
      });

    expect(res.status).toBe(409); // userController responde 409, no 400
    expect(res.body.msg).toMatch(/ya está registrado/i);
  });
});