// backend/src/config/seed.js
// Ejecutar UNA VEZ: npm run seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, connectDB } = require("./db");

const USUARIOS = [
  {
    nombre: "Super Admin",
    correo: "superadmin@mesasmart.com",
    correo_personal: "superadmin.personal@mesasmart.com",
    telefono: "0000000000",
    password: "superadmin123",
    rol: "super_admin",
    numero: 0,
    restaurante_id: null,
  },
  {
    nombre: "Administrador",
    correo: "admin@mesasmart.com",
    correo_personal: "admin.personal@mesasmart.com",
    telefono: "0000000001",
    password: "admin123",
    rol: "admin",
    numero: 1,
    restaurante_id: 1, // 👈 ajusta al ID real de tu restaurante
  },
  {
    nombre: "Cocina 1",
    correo: "cocina@mesasmart.com",
    correo_personal: "cocina.personal@mesasmart.com",
    telefono: "0000000002",
    password: "cocina123",
    rol: "cocina",
    numero: 1,
    restaurante_id: 1,
  },
  {
    nombre: "Bar 1",
    correo: "bar@mesasmart.com",
    correo_personal: "bar.personal@mesasmart.com",
    telefono: "0000000003",
    password: "bar123",
    rol: "bartender",
    numero: 1,
    restaurante_id: 1,
  },
];

(async () => {
  await connectDB();
  for (const u of USUARIOS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute(
      `INSERT INTO usuarios (nombre, correo, correo_personal, telefono, password, rol, numero, restaurante_id)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
      [u.nombre, u.correo, u.correo_personal, u.telefono, hash, u.rol, u.numero, u.restaurante_id]
    );
    console.log(`✅ ${u.correo} / ${u.password}`);
  }
  console.log("\n✔ Seed completado");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });