// frontend/src/services/mesaService.js
import { api } from "./api";

export const mesaService = {
  getAll:       ()             => api.get("/mesas"),
  crear:        (nombre)       => api.post("/mesas", { nombre }),
  eliminar:     (id)           => api.delete(`/mesas/${id}`),
  updateEstado: (id, estado)   => api.patch(`/mesas/${id}/estado`, { estado }),
};