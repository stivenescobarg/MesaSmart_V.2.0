// frontend/src/services/api.js
// Cliente HTTP base. Lee el token y lo agrega a cada petición.
// Si el backend responde 401 → limpia el token y redirige al login.

import { authService } from "./authService";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const request = async (endpoint, options = {}) => {
  const token = authService.getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("ms_token");
      window.location.href = "/login";
    }
    throw new Error(data.msg || `Error ${res.status}`);
  }

  return data;
};

export const api = {
  get:    (endpoint)       => request(endpoint, { method: "GET" }),
  post:   (endpoint, body) => request(endpoint, { method: "POST",   body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: "DELETE" }),
};