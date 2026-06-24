// frontend/src/services/stockService.js
import { api } from "./api";

export const stockService = {
  getAll:             ()          => api.get("/stock"),
  getBajoStock:       ()          => api.get("/stock/bajo-stock"),
  getResumen:         ()          => api.get("/stock/resumen"),
  crear:              (data)      => api.post("/stock", data),
  actualizar:         (id, data)  => api.patch(`/stock/${id}`, data),
  eliminar:           (id)        => api.delete(`/stock/${id}`),
  registrarMovimiento:(data)      => api.post("/stock/movimientos", data),
  getMovimientos:     (id)        => api.get(`/stock/${id}/movimientos`),
};