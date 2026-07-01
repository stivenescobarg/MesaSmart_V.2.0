// tests/unit/authMiddleware.test.js
// Este test NO usa los mocks de setup.js. Se mockea manualmente.

// Importamos las dependencias reales
const authMiddleware = require('../../src/middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const Sesion = require('../../src/models/Sesion');

// Desactivamos los mocks globales para este test
jest.unmock('../../src/middlewares/authMiddleware');
jest.unmock('../../src/models/Sesion');
jest.unmock('jsonwebtoken');

// Mockeamos jwt y Sesion solo para este archivo
jest.mock('jsonwebtoken');
jest.mock('../../src/models/Sesion');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debería rechazar si no hay token', async () => {
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token requerido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería rechazar si el token no es Bearer', async () => {
    req.headers.authorization = 'Basic token123';
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token requerido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería rechazar si el token es inválido', async () => {
    req.headers.authorization = 'Bearer token123';
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token inválido.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería rechazar si el token expiró', async () => {
    req.headers.authorization = 'Bearer token123';
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementationOnce(() => {
      throw error;
    });
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token expirado.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería rechazar si el token no tiene jti', async () => {
  req.headers.authorization = 'Bearer token123';
  jest.spyOn(jwt, 'verify').mockReturnValueOnce({ id: 1, rol: 'admin' });
  await authMiddleware(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ msg: 'Token inválido.' });
  expect(next).not.toHaveBeenCalled();
});

  it('debería rechazar si la sesión no está activa', async () => {
    req.headers.authorization = 'Bearer token123';
    jwt.verify.mockReturnValueOnce({ id: 1, rol: 'admin', jti: 'abc123' });
    Sesion.estaActiva.mockResolvedValueOnce(false);
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Sesión expirada. Inicia sesión de nuevo.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería pasar si todo es correcto', async () => {
    req.headers.authorization = 'Bearer token123';
    const decoded = { id: 1, rol: 'admin', jti: 'abc123' };
    jwt.verify.mockReturnValueOnce(decoded);
    Sesion.estaActiva.mockResolvedValueOnce(true);
    await authMiddleware(req, res, next);
    expect(req.usuario).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});