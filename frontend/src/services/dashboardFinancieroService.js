// frontend/src/services/dashboardFinancieroService.js
import { api } from "./api";

export const dashboardFinancieroService = {
  getResumen:        () => api.get("/dashboard-financiero"),
  getVentasVsGastos: () => api.get("/dashboard-financiero/ventas-vs-gastos"),
  getReportePeriodo: (desde, hasta) =>
    api.get(`/dashboard-financiero/reporte?desde=${desde}&hasta=${hasta}`),

  descargarExcel: (desde, hasta) =>
    api.download(
      `/dashboard-financiero/reporte/excel?desde=${desde}&hasta=${hasta}`,
      `reporte_financiero_${desde}_a_${hasta}.xlsx`
    ),
};