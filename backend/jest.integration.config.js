// jest.integration.config.js
// Corre SOLO los tests de integración (tests/integration/**), contra la
// base de datos real de Aiven. Usa un restaurante de prueba dedicado
// (slug "test-mesasmart") creado en globalSetup y borrado por completo
// en globalTeardown, así cada corrida arranca limpia.
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
  globalSetup: "<rootDir>/tests/integration/globalSetup.js",
  globalTeardown: "<rootDir>/tests/integration/globalTeardown.js",
  // Las queries reales contra Aiven pueden tardar más que un mock.
  testTimeout: 20000,
  verbose: true,
};