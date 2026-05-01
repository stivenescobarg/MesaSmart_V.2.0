// frontend/src/services/zonaService.js
import { api } from "./api";

export const zonaService = {
  getAll:  ()                      => api.get("/zonas"),
  crear:   ({ nombre, color })     => api.post("/zonas", { nombre, color }),
  update:  (id, { nombre, color }) => api.patch(`/zonas/${id}`, { nombre, color }),
  eliminar:(id)                    => api.delete(`/zonas/${id}`),
};