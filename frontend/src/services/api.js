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

// Construye el Error a partir de la respuesta del backend, conservando
// los campos extra que manda requierePlan.js (codigo, feature, plan_actual)
// además del status HTTP. Así un componente puede hacer:
//   if (err.codigo === "PLAN_INSUFICIENTE") { ...mostrar upsell... }
// en vez de solo mostrar err.message como error genérico.
const construirError = (data, status) => {
  const err = new Error(data.msg || `Error ${status}`);
  err.status = status;
  if (data.codigo)      err.codigo = data.codigo;
  if (data.feature)     err.feature = data.feature;
  if (data.plan_actual) err.plan_actual = data.plan_actual;
  return err;
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
    throw construirError(data, res.status);
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
    throw construirError(data, res.status);
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