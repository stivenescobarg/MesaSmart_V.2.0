// frontend/src/services/api.js
import { authService } from "./authService";
import { API_URL } from "./config";

const handleUnauthorized = (hadToken) => {
  // Solo redirigimos a la fuerza si HABÍA una sesión activa que expiró.
  // Si no había token, es un intento de login fallido: dejamos que
  // el componente que hizo la llamada maneje el error normalmente.
  if (hadToken) {
    localStorage.removeItem("ms_token");
    window.location.href = "/login";
  }
};

const request = async (endpoint, options = {}) => {
  const token = authService.getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
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
      handleUnauthorized(Boolean(token));
    }
    throw new Error(data.msg || `Error ${res.status}`);
  }

  return data;
};

const downloadFile = async (endpoint, filename) => {
  const token = authService.getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized(Boolean(token));
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.msg || `Error ${res.status}`);
  }

  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const api = {
  get:    (endpoint)       => request(endpoint, { method: "GET" }),
  post:   (endpoint, body) => request(endpoint, { method: "POST",   body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: "DELETE" }),
  download: downloadFile,
};