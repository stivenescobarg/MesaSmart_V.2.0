// frontend/src/services/facturaProveedorService.js
import { api } from "./api";

export const facturaProveedorService = {
  getAll: ({ proveedor_id, estado, fecha_desde, fecha_hasta, vencidas, proximas } = {}) => {
    const params = new URLSearchParams();
    if (proveedor_id) params.set("proveedor_id", proveedor_id);
    if (estado)       params.set("estado", estado);
    if (fecha_desde)  params.set("fecha_desde", fecha_desde);
    if (fecha_hasta)  params.set("fecha_hasta", fecha_hasta);
    if (vencidas)     params.set("vencidas", "true");
    if (proximas)     params.set("proximas", "true");
    const qs = params.toString();
    return api.get(`/facturas-proveedor${qs ? `?${qs}` : ""}`);
  },

  getIndicadores: ()          => api.get("/facturas-proveedor/indicadores"),
  getById:        (id)        => api.get(`/facturas-proveedor/${id}`),
  crear:          (data)      => api.post("/facturas-proveedor", data),
  registrarPago:  (id, pago)  => api.post(`/facturas-proveedor/${id}/pagos`, pago),
  eliminar:       (id)        => api.delete(`/facturas-proveedor/${id}`),
};

// ── Helpers de presentación (mismo estilo que cajaService) ──
export const colorEstadoFactura = (estado) => ({
  pendiente: "chip-rojo",
  parcial:   "chip-amber",
  pagada:    "chip-verde",
}[estado] || "chip-neutro");

export const etiquetaEstadoFactura = (estado) => ({
  pendiente: "Pendiente",
  parcial:   "Parcial",
  pagada:    "Pagada",
}[estado] || estado);
