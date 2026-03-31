// ══════════════════════════════════════════════════════════════════
// services/authService.js
// Gestiona sesiones activas, auditoría y persistencia de sesión.
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, removeItem, KEYS } from "./storageService";

// ── SESIÓN ACTIVA ────────────────────────────────────────────────

/**
 * Inicia una sesión: persiste el usuario activo y registra en auditoría.
 * @returns {object} registro de sesión creado
 */
export const iniciarSesion = (usuario) => {
  const sesion = {
    id:          `ses_${Date.now()}`,
    usuarioId:   usuario.id,
    correo:      usuario.correo,
    rol:         usuario.rol,
    inicio:      new Date().toISOString(),
    fin:         null,
    duracion:    null,
    dispositivo: navigator.userAgent.split(")")[0].split("(")[1] || "Desconocido",
  };

  // Guardar sesión activa (persiste al recargar)
  setItem(KEYS.SESION_ACTIVA, { usuario, sesion });

  // Agregar a la lista de sesiones concurrentes
  const activas = getItem(KEYS.SESIONES_ACTIVAS, []);
  setItem(KEYS.SESIONES_ACTIVAS, [...activas, sesion]);

  return sesion;
};

/**
 * Cierra la sesión activa y registra hora de cierre + duración.
 */
export const cerrarSesion = (sesionId) => {
  const fin      = new Date();
  const activas  = getItem(KEYS.SESIONES_ACTIVAS, []);
  const sesion   = activas.find((s) => s.id === sesionId);

  if (sesion) {
    const inicio   = new Date(sesion.inicio);
    const durMs    = fin - inicio;
    const durMin   = Math.floor(durMs / 60000);
    const durSeg   = Math.floor((durMs % 60000) / 1000);

    const sesionCerrada = {
      ...sesion,
      fin:      fin.toISOString(),
      duracion: `${durMin}m ${durSeg}s`,
    };

    // Guardar en auditoría
    const auditoria = getItem(KEYS.AUDITORIA_SESIONES, []);
    setItem(KEYS.AUDITORIA_SESIONES, [...auditoria, sesionCerrada]);
  }

  // Quitar de activas
  setItem(KEYS.SESIONES_ACTIVAS, activas.filter((s) => s.id !== sesionId));

  // Limpiar sesión persistida
  removeItem(KEYS.SESION_ACTIVA);
};

/**
 * Recupera el usuario y sesión activa (útil al recargar la página).
 */
export const getSesionActiva = () => getItem(KEYS.SESION_ACTIVA, null);

/**
 * Retorna todas las sesiones concurrentes activas.
 */
export const getSesionesActivas = () => getItem(KEYS.SESIONES_ACTIVAS, []);

/**
 * Retorna el historial completo de auditoría.
 */
export const getAuditoria = () => getItem(KEYS.AUDITORIA_SESIONES, []);

/**
 * Limpia sesiones activas huérfanas (sin actividad > 8h).
 * Llamar al iniciar la app.
 */
export const limpiarSesionesHuerfanas = () => {
  const activas   = getItem(KEYS.SESIONES_ACTIVAS, []);
  const ahora     = Date.now();
  const LIMITE_MS = 8 * 60 * 60 * 1000; // 8 horas

  const vigentes = activas.filter((s) => {
    const diff = ahora - new Date(s.inicio).getTime();
    return diff < LIMITE_MS;
  });

  // Registrar las huérfanas en auditoría como "Expirada"
  const huerfanas = activas.filter((s) => !vigentes.includes(s));
  if (huerfanas.length > 0) {
    const auditoria = getItem(KEYS.AUDITORIA_SESIONES, []);
    const cerradas  = huerfanas.map((s) => ({
      ...s, fin: new Date().toISOString(), duracion: "Sesión expirada",
    }));
    setItem(KEYS.AUDITORIA_SESIONES, [...auditoria, ...cerradas]);
    setItem(KEYS.SESIONES_ACTIVAS, vigentes);
  }
};