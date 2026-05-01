// frontend/src/services/metricaService.js
import { api } from "./api";

export const metricaService = {
  getResumen:      () => api.get("/metricas/resumen"),
  getVentasPorDia: () => api.get("/metricas/ventas-por-dia"),
  getMetodosPago:  () => api.get("/metricas/metodos-pago"),
};