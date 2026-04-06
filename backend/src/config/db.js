// backend/src/config/db.js
// UN SOLO archivo de conexión para todo el proyecto.
// Usa mysql2/promise con pool — compatible con el admin Y el menú.

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "mesasmart",
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           "-05:00",
});

const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL conectado —", process.env.DB_NAME || "mesasmart");
    conn.release();
  } catch (err) {
    console.error("❌ Error MySQL:", err.message);
    process.exit(1);
  }
};

// Exportamos pool Y connectDB
// Para rutas del admin:  const { pool } = require("../config/db")
// Para rutas del menú:   const { pool } = require("../config/db")  (mismo import)
module.exports = { pool, connectDB };