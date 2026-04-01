// frontend/src/services/cajaService.js
import { api } from "./api";

export const cajaService = {
  getEstado:     ()      => api.get("/caja/estado"),
  abrir:         (monto) => api.post("/caja/abrir",  { monto_inicial: monto }),
  cerrar:        ()      => api.post("/caja/cerrar"),
  getHistorial:  ()      => api.get("/caja/historial"),
  registrarPago: (data)  => api.post("/caja/pago", data),
};

export const calcularTotalVendido = (caja) => {
  if (!caja || !caja.ventas) return 0;
  return caja.ventas.reduce((acc, v) => acc + (v.total || 0), 0);
};

export const desglosarPorMetodo = (ventas) => {
  if (!ventas || ventas.length === 0) return {};

  return ventas.reduce((acc, venta) => {
    const metodo = venta.metodo || "Desconocido";

    if (!acc[metodo]) {
      acc[metodo] = 0;
    }

    acc[metodo] += venta.total || 0;

    return acc;
  }, {});
};
