// frontend/src/components/bar/utils/formatters.js

// ── Fecha legible (ej: "10 jun 14:35") ──────────────────────
export const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) +
  " " +
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

// ── Tiempo transcurrido desde iso (ej: "3min", "1h 20m") ────
export const tiempoEla = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

// ── Countdown mm:ss (ej: "4:07") ────────────────────────────
export const fmtCountdown = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ── Duración en minutos legible (ej: "1h 30m") ──────────────
export const fmtDuracion = (min) => {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

// ── Porcentaje de stock sobre el mínimo (máx 100%) ──────────
export const pctStock = (actual, minimo) =>
  Math.min(100, Math.round((Number(actual) / Math.max(Number(minimo) * 1.5, 1)) * 100));

// ── Número de mesa sin letras (ej: "Mesa 3" → "3") ──────────
export const numMesa = (mesa) => mesa?.replace(/\D/g, "") || "?";