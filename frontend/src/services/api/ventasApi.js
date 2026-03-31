// ══════════════════════════════════════════════════════════════════
// services/api/ventasApi.js
// Registro y consulta de ventas — preparado para backend PHP + MySQL.
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, KEYS } from "../storageService";

/**
 * Registra una venta con detalle completo de productos.
 * @param {object} venta — { mesa, total, metodo, items[], usuarioId }
 */
export const registrarVenta = async (venta) => {
  const caja = getItem(KEYS.CAJA_ACTUAL, null);
  if (!caja) return { ok: false, error: "No hay caja abierta." };

  const nuevaVenta = {
    id:        `v_${Date.now()}`,
    mesa:      venta.mesa,
    total:     venta.total,
    metodo:    venta.metodo,
    fecha:     new Date().toLocaleDateString("es-CO"),
    hora:      new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    fechaHora: new Date().toISOString(),
    items:     venta.items || [],      // [{ nombre, cantidad, precio }]
    usuarioId: venta.usuarioId || null,
  };

  const cajaActualizada = { ...caja, ventas: [...caja.ventas, nuevaVenta] };
  setItem(KEYS.CAJA_ACTUAL, cajaActualizada);
  return { ok: true, venta: nuevaVenta, caja: cajaActualizada };
};

export const getHistorial = async () => {
  return getItem(KEYS.HISTORIAL, []);
};