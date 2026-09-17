// jest.unit.config.js
// Tests unitarios puros: no tocan la BD, todo mockeado (jwt, modelos, etc.)
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
  testTimeout: 5000,
};