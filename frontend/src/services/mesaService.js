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

  // NUEVO: descarga el PNG del QR de una mesa (usa Authorization + blob,
  // por eso no basta un <img src="..."> directo — el endpoint es protegido).
  descargarQR:   (id, nombreMesa) => api.download(`/mesas/${id}/qr`, `qr-mesa-${nombreMesa}.png`),
};