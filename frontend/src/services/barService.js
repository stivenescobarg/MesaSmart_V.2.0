// frontend/src/services/barService.js
import { api } from "./api";

export const barService = {
  getActivas: () => api.get("/bar/ordenes"),
  getHistorial: () => api.get("/bar/historial"),
  getResumen: () => api.get("/bar/resumen"),
  actualizarEstado: (id, estado) => api.patch(`/bar/ordenes/${id}/estado`, { estado }),
  // pagarParcial: reduce cantidades específicas dentro de una orden de bar.
  // pagos: [{ index: <posición del item en el array de la orden>, cantidad: <cuánto se pagó> }]
  pagarParcial: (id, pagos) => api.patch(`/bar/ordenes/${id}/pagar-parcial`, { pagos }),
  getInventario: () => api.get("/bar/inventario"),
  registrarConsumo: (data) => api.post("/bar/inventario/consumos", data),
  getActividad: () => api.get("/bar/actividad"),
};