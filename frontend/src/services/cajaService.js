// ══════════════════════════════════════════════════════════════════
// cajaService.js — Lógica de negocio para caja y ventas
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, removeItem, KEYS } from "./storageService";

// ── ESTRUCTURAS ──────────────────────────────────────────────────

/**
 * Estructura de una caja abierta:
 * {
 *   montoInicial: number,
 *   fechaApertura: string (ISO),
 *   ventas: Venta[],
 * }
 *
 * Estructura de una Venta:
 * {
 *   id: string,
 *   mesa: string,
 *   total: number,
 *   metodo: "Efectivo" | "Tarjeta" | "Transferencia",
 *   hora: string,
 *   items: { nombre, cantidad, precio }[],
 * }
 */

/** Crea el objeto de apertura de caja */
export const crearAperturaCaja = (montoInicial) => ({
  montoInicial,
  fechaApertura: new Date().toISOString(),
  ventas: [],
});

/** Persiste la caja actual en localStorage */
export const guardarCaja = (caja) => {
  setItem(KEYS.CAJA_ACTUAL, caja);
  setItem(KEYS.CAJA_ABIERTA, true);
};

/** Agrega una venta a la caja actual y la persiste */
export const registrarVenta = (caja, venta) => {
  const nuevaVenta = {
    id: `v_${Date.now()}`,
    mesa: venta.mesa,
    total: venta.total,
    metodo: venta.metodo,
    hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    items: venta.items || [],
  };
  const cajaActualizada = {
    ...caja,
    ventas: [...caja.ventas, nuevaVenta],
  };
  guardarCaja(cajaActualizada);
  return cajaActualizada;
};

/** Calcula el total vendido en la caja actual */
export const calcularTotalVendido = (caja) =>
  (caja?.ventas || []).reduce((acc, v) => acc + v.total, 0);

/** Genera el resumen de cierre de caja y lo agrega al historial */
export const cerrarCaja = (caja, historialActual) => {
  const totalVentas = calcularTotalVendido(caja);
  const resumen = {
    id: `cierre_${Date.now()}`,
    fecha: new Date().toLocaleDateString("es-CO"),
    fechaCierre: new Date().toISOString(),
    montoInicial: caja.montoInicial,
    totalVentas,
    montoFinal: caja.montoInicial + totalVentas,
    cantidadVentas: caja.ventas.length,
    ventas: caja.ventas,
    desglosePorMetodo: desglosarPorMetodo(caja.ventas),
  };

  const nuevoHistorial = [...historialActual, resumen];
  setItem(KEYS.HISTORIAL, nuevoHistorial);
  removeItem(KEYS.CAJA_ACTUAL);
  setItem(KEYS.CAJA_ABIERTA, false);

  return { resumen, nuevoHistorial };
};

/** Agrupa el total de ventas por método de pago */
export const desglosarPorMetodo = (ventas = []) => {
  return ventas.reduce((acc, v) => {
    acc[v.metodo] = (acc[v.metodo] || 0) + v.total;
    return acc;
  }, {});
};

/** Carga la caja activa desde localStorage */
export const cargarCaja = () => ({
  abierta: getItem(KEYS.CAJA_ABIERTA, false),
  caja: getItem(KEYS.CAJA_ACTUAL, null),
});

/** Carga el historial de ventas desde localStorage */
export const cargarHistorial = () => getItem(KEYS.HISTORIAL, []);