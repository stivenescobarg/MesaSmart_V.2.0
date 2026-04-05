// frontend/src/services/authService.js
// LIMPIO: solo guarda el TOKEN en localStorage.
// Los datos del usuario vienen del backend en cada verificación.

import { api } from "./api";

const TOKEN_KEY = "ms_token";

export const authService = {
  // Llama al backend, guarda el token
  login: async (correo, password) => {
    const data = await api.post("/auth/login", { correo, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data; // { ok, token, usuario: { id, nombre, correo, rol, numero } }
  },

  // Avisa al backend y borra el token local
  logout: async () => {
    try { await api.post("/auth/logout"); } catch { /* ignorar si ya expiró */ }
    localStorage.removeItem(TOKEN_KEY);
  },

  // Verifica el token con el backend al recargar la página
  verificarSesion: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const data = await api.get("/auth/me");
      return data.usuario; // { id, nombre, correo, rol, numero }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),
};