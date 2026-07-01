// Mocks para la base de datos
const mockQuery = jest.fn();
const mockExecute = jest.fn();
const mockGetConnection = jest.fn(() => ({
  query: mockQuery,
  execute: mockExecute,
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
}));

module.exports = {
  mockQuery,
  mockExecute,
  mockGetConnection,
  pool: {
    query: mockQuery,
    execute: mockExecute,
    getConnection: mockGetConnection,
  },
};