// backend/src/config/seed.js
// Ejecutar UNA VEZ: npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, connectDB } = require("./db");

const USUARIOS = [
  { nombre: "Administrador", correo: "admin@mesasmart.com",  password: "admin123",  rol: "admin",     numero: 1 },
  { nombre: "Cocina 1",      correo: "cocina@mesasmart.com", password: "cocina123", rol: "cocina",    numero: 1 },
  { nombre: "Bar 1",         correo: "bar@mesasmart.com",    password: "bar123",    rol: "bartender", numero: 1 },
];

(async () => {
  await connectDB();
  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute(
      `INSERT INTO usuarios (nombre, correo, password, rol, numero)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
      [u.nombre, u.correo, hash, u.rol, u.numero]
    );
    console.log(`✅ ${u.correo} / ${u.password}`);
  }
  console.log("\n✔ Seed completado");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });