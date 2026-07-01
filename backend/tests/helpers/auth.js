const jwt = require('jsonwebtoken');

const getAuthToken = () => {
  const token = jwt.sign(
    { id: 1, nombre: 'Admin Test', email: 'admin@test.com', rol: 'admin' },
    'test-secret',
    { expiresIn: '1h' }
  );
  return { token };
};

module.exports = { getAuthToken };