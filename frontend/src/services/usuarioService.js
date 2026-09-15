// frontend/src/services/usuarioService.js
import { api } from "./api";

export const usuarioService = {
  getAll: () => api.get("/usuarios"),

  crear: ({ nombre, correo, correo_personal, telefono, password, rol }) =>
    api.post("/usuarios", { nombre, correo, correo_personal, telefono, password, rol }),

  eliminar: (id) => api.delete(`/usuarios/${id}`),

  reactivar: (id) => api.patch(`/usuarios/${id}/reactivar`),

  getSesiones: () => api.get("/usuarios/sesiones"),
};