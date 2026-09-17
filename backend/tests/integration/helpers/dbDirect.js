// tests/integration/helpers/dbDirect.js
//
// Pool de mysql2 totalmente aparte del que arma src/config/db.js (el de
// la app). globalSetup y globalTeardown lo usan solo para sus queries
// directas (verificar/crear categorías, borrar el restaurante de
// prueba), así cada uno abre y cierra su propia conexión sin depender
// del ciclo de vida del pool de la app — que es justo lo que causaba el
// "Pool is closed." al final de la corrida.

const mysql = require("mysql2/promise");

function crearPoolDirecto() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: "Z",
    connectionLimit: 3,
  });
}

module.exports = { crearPoolDirecto };