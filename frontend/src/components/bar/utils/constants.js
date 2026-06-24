// frontend/src/components/bar/utils/constants.js

export const API = "http://localhost:3001";

// ── Config de estados de orden ───────────────────────────────
export const ESTADO_CFG = {
  pendiente:      { label: "Nueva",      cls: "bd-pill-new"    },
  en_preparacion: { label: "Preparando", cls: "bd-pill-prep"   },
  pausado:        { label: "Pausada",    cls: "bd-pill-paused" },
  listo:          { label: "Lista",      cls: "bd-pill-done"   },
};

// ── Chips predefinidos de modificaciones ─────────────────────
export const MODS_PREDEFINIDAS = [
  "Sin hielo", "Extra hielo", "Sin azúcar", "Doble",
  "Con limón", "Sin limón", "Fuerte", "Suave",
];

// ── Filtros del tab de pedidos ───────────────────────────────
export const FILTROS = [
  { key: "todos",          label: "Todas"      },
  { key: "pendiente",      label: "Nuevas"     },
  { key: "en_preparacion", label: "Preparando" },
  { key: "pausado",        label: "Pausadas"   },
  { key: "ancladas",       label: "Ancladas"   },
];

// ── Tabs del header ──────────────────────────────────────────
export const TABS = [
  { key: "pedidos",    label: "Pedidos",    icon: "📋" },
  { key: "inventario", label: "Inventario", icon: "🍶" },
  { key: "historial",  label: "Historial",  icon: "📜" },
  { key: "sesiones",   label: "Sesiones",   icon: "📊" },
];

// ── Tiempo (ms) para considerar una orden urgente ────────────
export const UMBRAL_URGENTE_MS = 300_000; // 5 minutos