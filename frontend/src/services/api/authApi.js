// ══════════════════════════════════════════════════════════════════
// services/api/authApi.js
// Capa de abstracción para autenticación.
// Actualmente usa localStorage, pero la firma de cada función
// coincide exactamente con lo que esperaría un fetch() real.
//
// MIGRACIÓN A PHP:
//   Reemplaza el cuerpo de cada función por:
//   return fetch("http://localhost/api/auth/login", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ correo, password }),
//   }).then(r => r.json());
// ══════════════════════════════════════════════════════════════════

import { getItem, KEYS } from "../storageService";
import { hashPassword } from "../userService";

/**
 * Intenta autenticar un usuario.
 * @returns {{ ok: boolean, usuario?: object, error?: string }}
 */
export const login = async (correo, password) => {
  // Simula latencia de red (quitar en producción)
  await new Promise((r) => setTimeout(r, 350));

  const usuarios = getItem(KEYS.USUARIOS, []);
  const hash     = hashPassword(password);
  const usuario  = usuarios.find(
    (u) => u.correo === correo && u.passwordHash === hash
  );

  if (!usuario) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  return { ok: true, usuario };
};

/**
 * Cierra la sesión del usuario activo.
 * En backend real: invalida el token JWT / destruye la sesión PHP.
 */
export const logout = async (usuarioId) => {
  await new Promise((r) => setTimeout(r, 100));
  return { ok: true };
};

/**
 * Verifica si hay una sesión activa persistida (por recarga de página).
 * @returns {object|null} usuario o null
 */
export const checkSession = () => {
  return getItem(KEYS.SESION_ACTIVA, null);
};