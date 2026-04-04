// frontend/src/services/usuarioService.js
// FIX: el id viene como número de MySQL, convertir a string en la URL

import { api } from "./api";

export const usuarioService = {
  getAll:    ()                          => api.get("/usuarios"),
  crear:     ({ correo, password, rol }) => api.post("/usuarios", { correo, password, rol }),

  // FIX BUG 3: asegurar que el id se interpola correctamente en la URL
  eliminar:  (id) => api.delete(`/usuarios/${id}`),

  getSesiones: () => api.get("/usuarios/sesiones"),
};