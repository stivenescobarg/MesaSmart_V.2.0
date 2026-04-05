// ══════════════════════════════════════════════════════════════════
// setup-admin.js
// Ejecuta este script UNA VEZ en la consola del navegador
// para crear el primer usuario administrador del sistema.
//
// INSTRUCCIONES:
//   1. Abre http://localhost:5173 en el navegador
//   2. Abre DevTools → Console (F12)
//   3. Pega TODO este código y presiona Enter
//   4. Recarga la página
//   5. Inicia sesión con admin@mesasmart.co / admin123
// ══════════════════════════════════════════════════════════════════

(function crearAdminInicial() {
  const SALT = "ms_2026_salt";

  // Mismo algoritmo que userService.js → hashPassword
  const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  };

  const hashPassword = (password) => hashString(SALT + password + SALT);

  const KEY_USUARIOS = "ms_users";

  const existentes = JSON.parse(localStorage.getItem(KEY_USUARIOS) || "[]");

  if (existentes.some((u) => u.correo === "admin@mesasmart.co")) {
    console.log("✅ El usuario admin ya existe. Puedes iniciar sesión.");
    return;
  }

  const admin = {
    id:           "u_admin_inicial",
    correo:       "admin@mesasmart.co",
    passwordHash: hashPassword("admin123"),
    rol:          "administrador",
    numero:       1,
    creadoEn:     new Date().toISOString(),
  };

  localStorage.setItem(KEY_USUARIOS, JSON.stringify([...existentes, admin]));

  console.log("✅ Usuario administrador creado:");
  console.log("   Correo:     admin@mesasmart.co");
  console.log("   Contraseña: admin123");
  console.log("   Recarga la página y ya puedes iniciar sesión.");
})();