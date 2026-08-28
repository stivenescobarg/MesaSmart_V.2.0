// frontend/src/services/barService.js
import { api } from "./api";

export const barService = {
  getActivas: () => api.get("/bar/ordenes"),
  getHistorial: () => api.get("/bar/historial"),
  getResumen: () => api.get("/bar/resumen"),
  actualizarEstado: (id, estado) => api.patch(`/bar/ordenes/${id}/estado`, { estado }),
  getInventario: () => api.get("/bar/inventario"),
  registrarConsumo: (data) => api.post("/bar/inventario/consumos", data),
  getActividad: () => api.get("/bar/actividad"),
};