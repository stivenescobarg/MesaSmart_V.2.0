// frontend/src/services/quejaService.js
import { api } from "./api";

export const quejaService = {
  getAll:         ()           => api.get("/quejas"),
  updateEstado:   (id, estado) => api.patch(`/quejas/${id}/estado`, { estado }),
};