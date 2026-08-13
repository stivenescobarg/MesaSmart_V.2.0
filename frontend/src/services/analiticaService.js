// frontend/src/services/analiticaService.js
import { api } from "./api";

const buildQS = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export const analiticaService = {
  getVentasAgrupadas: ({ agrupacion, periodo, fecha_desde, fecha_hasta } = {}) =>
    api.get(`/analitica/ventas-agrupadas${buildQS({ agrupacion, periodo, fecha_desde, fecha_hasta })}`),

  getIngresosVsGastos: ({ periodo, fecha_desde, fecha_hasta } = {}) =>
    api.get(`/analitica/ingresos-vs-gastos${buildQS({ periodo, fecha_desde, fecha_hasta })}`),

  getCategoriasMasVendidas: ({ periodo, fecha_desde, fecha_hasta } = {}) =>
    api.get(`/analitica/categorias-mas-vendidas${buildQS({ periodo, fecha_desde, fecha_hasta })}`),

  getTopProductos: ({ periodo, fecha_desde, fecha_hasta, limit = 5 } = {}) =>
    api.get(`/analitica/top-productos${buildQS({ periodo, fecha_desde, fecha_hasta, limit })}`),

  getProductosMenorRotacion: ({ limit = 5 } = {}) =>
    api.get(`/analitica/productos-menor-rotacion${buildQS({ limit })}`),

  getMetodosPago: ({ periodo, fecha_desde, fecha_hasta } = {}) =>
    api.get(`/analitica/metodos-pago${buildQS({ periodo, fecha_desde, fecha_hasta })}`),
};