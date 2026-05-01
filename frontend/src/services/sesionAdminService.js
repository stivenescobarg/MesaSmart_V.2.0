// frontend/src/services/sesionAdminService.js
import { api } from "./api";

export const sesionAdminService = {
  getSesiones:   ()           => api.get("/sesiones"),
  forzarLogout:  (usuario_id) => api.delete(`/sesiones/forzar/${usuario_id}`),
};