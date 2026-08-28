import { authService } from "./authService";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${authService.getToken()}`,
});

export const superAdminService = {
  listarRestaurantes: async () => {
    const res = await fetch(`${BASE}/super-admin/restaurantes`, { headers: headers() });
    if (!res.ok) throw new Error("Error al obtener restaurantes.");
    return res.json();
  },

  crearRestaurante: async (datos) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al crear restaurante.");
    return data;
  },

  activar: async (id) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/${id}/activar`, {
      method: "PATCH",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al activar.");
    return data;
  },

  suspender: async (id) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/${id}/suspender`, {
      method: "PATCH",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al suspender.");
    return data;
  },

  // ── Detalle del restaurante: info + admin + estado/historial de pagos ──
  getDetalle: async (id) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/${id}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al obtener el detalle del restaurante.");
    return data;
  },

  // ── Registrar un pago de suscripción manual ──
  registrarPago: async (id, datos) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/${id}/pagos`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al registrar el pago.");
    return data;
  },

  // ── Cambiar el plan de un restaurante ──
  cambiarPlan: async (id, plan) => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/${id}/plan`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Error al cambiar el plan.");
    return data;
  },

  // ── Descargar Excel con todos los restaurantes + historial de pagos ──
  descargarExcel: async () => {
    const res = await fetch(`${BASE}/super-admin/restaurantes/exportar-excel`, {
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.msg || "Error al generar el Excel.");
    }
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mesasmart_restaurantes_${new Date().toISOString().split("T")[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};