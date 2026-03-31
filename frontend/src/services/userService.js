// ══════════════════════════════════════════════════════════════════
// userService.js — Lógica de usuarios, validación y hash básico
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, KEYS } from "./storageService";

const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const SALT = "ms_2026_salt";
export const hashPassword = (password) => hashString(SALT + password + SALT);

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarUsuario = (correo, password, usuarios) => {
  const errores = [];
  const correoNorm = correo.toLowerCase().trim();

  if (!REGEX_EMAIL.test(correoNorm)) {
    errores.push("El correo no tiene un formato válido.");
  }
  if (password.length < 6) {
    errores.push("La contraseña debe tener al menos 6 caracteres.");
  }
  if (usuarios.some((u) => u.correo.toLowerCase() === correoNorm)) {
    errores.push("Ya existe un usuario con ese correo.");
  }

  return errores;
};

export const cargarUsuarios = () => getItem(KEYS.USUARIOS, []);

/** Guarda la lista completa en el storage */
export const guardarUsuarios = (usuarios) => setItem(KEYS.USUARIOS, usuarios);

export const crearUsuario = (usuarios, { correo, password, rol }) => {
  const correoNorm = correo.toLowerCase().trim();
  const mismoRol = usuarios.filter((u) => u.rol === rol);
  
  const nuevo = {
    id: `u_${Date.now()}`,
    correo: correoNorm,
    passwordHash: hashPassword(password),
    rol,
    numero: mismoRol.length + 1,
    creadoEn: new Date().toISOString(),
  };

  const actualizado = [...usuarios, nuevo];
  guardarUsuarios(actualizado); // Persistencia inmediata
  return actualizado;
};

export const eliminarUsuario = (usuarios, id) => {
  const actualizado = usuarios.filter((u) => u.id !== id);
  guardarUsuarios(actualizado); // Persistencia inmediata
  return actualizado;
};

export const verificarCredenciales = (usuarios, correo, password) => {
  const correoNorm = correo.toLowerCase().trim();
  const hash = hashPassword(password);
  
  // Buscamos comparando ambos en minúsculas y el hash de la contraseña
  return usuarios.find(
    (u) => u.correo.toLowerCase() === correoNorm && u.passwordHash === hash
  ) || null;
};

export const etiquetaRol = (rol) => {
  const etiquetas = {
    cocina: "🍳 Cocina",
    bartender: "🍹 Bartender",
    administrador: "🛡️ Administrador",
  };
  return etiquetas[rol] || rol;
};