// ══════════════════════════════════════════════════════════════════
// services/api/usuariosApi.js
// CRUD de usuarios — preparado para backend PHP + MySQL.
//
// MIGRACIÓN:
//   export const getUsuarios = () =>
//     fetch("http://localhost/api/usuarios").then(r => r.json());
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, KEYS } from "../storageService";
import { hashPassword } from "../userService";

export const getUsuarios = async () => {
  await new Promise((r) => setTimeout(r, 100));
  return getItem(KEYS.USUARIOS, []);
};

export const crearUsuario = async ({ correo, password, rol }) => {
  const usuarios = getItem(KEYS.USUARIOS, []);
  const mismoRol = usuarios.filter((u) => u.rol === rol);
  const nuevo = {
    id:           `u_${Date.now()}`,
    correo,
    passwordHash: hashPassword(password),
    rol,
    numero:       mismoRol.length + 1,
    creadoEn:     new Date().toISOString(),
  };
  const actualizado = [...usuarios, nuevo];
  setItem(KEYS.USUARIOS, actualizado);
  return { ok: true, usuario: nuevo, usuarios: actualizado };
};

export const eliminarUsuario = async (id) => {
  const usuarios   = getItem(KEYS.USUARIOS, []);
  const actualizado = usuarios.filter((u) => u.id !== id);
  setItem(KEYS.USUARIOS, actualizado);
  return { ok: true, usuarios: actualizado };
};