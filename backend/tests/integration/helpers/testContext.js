// tests/integration/helpers/testContext.js
const fs = require("fs");
const path = require("path");

const CONTEXT_FILE = path.join(__dirname, "..", ".test-context.json");

function getTestContext() {
  if (!fs.existsSync(CONTEXT_FILE)) {
    throw new Error(
      "No se encontró el contexto de test. Corré la suite con " +
        "`npm run test:integration` (necesita globalSetup)."
    );
  }
  return JSON.parse(fs.readFileSync(CONTEXT_FILE, "utf-8"));
}

module.exports = { getTestContext };