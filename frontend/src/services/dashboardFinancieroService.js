// frontend/src/services/dashboardFinancieroService.js
import { api } from "./api";

export const dashboardFinancieroService = {
  getResumen:        () => api.get("/dashboard-financiero"),
  getVentasVsGastos: () => api.get("/dashboard-financiero/ventas-vs-gastos"),
};