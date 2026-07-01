// tests/setup.js
// Mocks globales para tests de integración

jest.mock('../src/middlewares/authMiddleware', () => {
  return (req, res, next) => {
    req.usuario = {
      id: 1,
      nombre: 'Admin Test',
      email: 'admin@test.com',
      rol: 'admin',
      jti: 'test-jti'
    };
    next();
  };
});

jest.mock('../src/middlewares/roleMiddleware', () => {
  return (rolesPermitidos) => {
    return (req, res, next) => {
      next();
    };
  };
});

jest.mock('../src/models/Sesion', () => ({
  estaActiva: jest.fn().mockResolvedValue(true),
  crear: jest.fn().mockResolvedValue('test-jti'),
  cerrar: jest.fn().mockResolvedValue(true),
  cerrarTodas: jest.fn().mockResolvedValue(true),
  getActivas: jest.fn().mockResolvedValue([]),
  getHistorial: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[], []]),
    execute: jest.fn().mockResolvedValue([{ insertId: 1 }, []]),
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([[], []]),
      execute: jest.fn().mockResolvedValue([{ insertId: 1 }, []]),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    })
  }
}));

// El controlador real usa "bcryptjs", no "bcrypt" — hay que mockear el paquete correcto
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('fake-jwt-token'),
  verify: jest.fn().mockReturnValue({
    id: 1,
    rol: 'admin',
    jti: 'test-jti'
  })
}));