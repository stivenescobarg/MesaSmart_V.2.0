// frontend/src/services/mesaService.js
import { api } from "./api";

export const mesaService = {
  getAll:        ()                              => api.get("/mesas"),
  crear:         (data)                          => api.post("/mesas", data),
  eliminar:      (id)                            => api.delete(`/mesas/${id}`),
  updateEstado:  (id, estado)                    => api.patch(`/mesas/${id}/estado`, { estado }),
  updatePosicion:(id, pos_x, pos_y)             => api.patch(`/mesas/${id}/posicion`, { pos_x, pos_y }),
  updateConfig:  (id, data)                      => api.patch(`/mesas/${id}/config`, data),
  savePosiciones:(posiciones)                    => api.patch("/mesas/batch/posiciones", { posiciones }),
};