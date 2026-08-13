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
};