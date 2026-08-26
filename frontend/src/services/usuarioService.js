// frontend/src/services/usuarioService.js
import { api } from "./api";

export const usuarioService = {
  getAll: () => api.get("/usuarios"),

  crear: ({ nombre, correo, correo_personal, telefono, password, rol }) =>
    api.post("/usuarios", { nombre, correo, correo_personal, telefono, password, rol }),

  // FIX BUG 3: asegurar que el id se interpola correctamente en la URL
  eliminar: (id) => api.delete(`/usuarios/${id}`),

  getSesiones: () => api.get("/usuarios/sesiones"),
};