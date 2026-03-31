// ══════════════════════════════════════════════════════════════════
// storageService.js — Capa de acceso a localStorage
// Centraliza todas las operaciones de persistencia del sistema
// ══════════════════════════════════════════════════════════════════

/** Claves del sistema — nunca usar strings literales fuera de aquí */
export const KEYS = {
  // Datos operativos
  MESAS:              "ms_mesas",
  CAJA_ABIERTA:       "ms_caja_abierta",
  CAJA_ACTUAL:        "ms_caja_actual",
  HISTORIAL:          "ms_historial_ventas",
  USUARIOS:           "ms_users",
  SERVICIO_ACTIVO:    "ms_servicio_activo",
  // Autenticación y sesiones
  SESION_ACTIVA:      "ms_sesion_activa",
  SESIONES_ACTIVAS:   "ms_sesiones_activas",
  AUDITORIA_SESIONES: "ms_auditoria_sesiones",
};

/** Lee y parsea un valor de localStorage */
export const getItem = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/** Serializa y guarda un valor en localStorage */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error(`[storage] Error guardando clave: ${key}`);
    return false;
  }
};

/** Elimina una clave de localStorage */
export const removeItem = (key) => {
  localStorage.removeItem(key);
};

/** Limpia solo las claves del sistema MesaSmart */
export const clearAll = () => {
  Object.values(KEYS).forEach(removeItem);
};