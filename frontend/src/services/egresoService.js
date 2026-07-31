// frontend/src/services/egresoService.js
import { api } from "./api";

export const egresoService = {
  getActuales:  ()                                   => api.get("/egresos"),
  crear:        ({ descripcion, categoria, monto })   => api.post("/egresos", { descripcion, categoria, monto }),
  getCategorias: ()                                   => api.get("/egresos/categorias"),

  // periodo: "hoy" | "semana" | "mes" | "anio" | "personalizado"
  getHistorial: ({ periodo, fecha_desde, fecha_hasta, categoria } = {}) => {
    const params = new URLSearchParams();
    if (periodo)      params.set("periodo", periodo);
    if (fecha_desde)  params.set("fecha_desde", fecha_desde);
    if (fecha_hasta)  params.set("fecha_hasta", fecha_hasta);
    if (categoria)    params.set("categoria", categoria);
    const qs = params.toString();
    return api.get(`/egresos/historial${qs ? `?${qs}` : ""}`);
  },

  getGraficos: ({ periodo, fecha_desde, fecha_hasta } = {}) => {
    const params = new URLSearchParams();
    if (periodo)      params.set("periodo", periodo);
    if (fecha_desde)  params.set("fecha_desde", fecha_desde);
    if (fecha_hasta)  params.set("fecha_hasta", fecha_hasta);
    const qs = params.toString();
    return api.get(`/egresos/graficos${qs ? `?${qs}` : ""}`);
  },
};

const COLORES_CATEGORIA = [
  "#f59e0b", "#3b82f6", "#a855f7", "#22c55e", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#84cc16", "#6366f1",
];

export const colorPorIndice = (i) => COLORES_CATEGORIA[i % COLORES_CATEGORIA.length];