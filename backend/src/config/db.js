require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "mesasmart",
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           "Z", // 👈 UTC — coincide con el servidor de Aiven, sin conversiones implícitas
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

module.exports = { pool, connectDB };