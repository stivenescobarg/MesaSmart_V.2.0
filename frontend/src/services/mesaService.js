// ══════════════════════════════════════════════════════════════════
// mesaService.js — Lógica de negocio para mesas y pedidos
// ══════════════════════════════════════════════════════════════════

import { getItem, setItem, KEYS } from "./storageService";

// ── DATOS DE PRUEBA ──────────────────────────────────────────────
/** Se cargan automáticamente si no hay datos en localStorage */
const DATOS_PRUEBA = [
  {
    id: 1, nombre: "Mesa 1", ocupada: true, estado: "ocupada",
    pedido: [
      { id: "p1", nombre: "Hamburguesa clásica", cantidad: 2, precio: 22000, categoria: "comida", observacion: "Sin cebolla" },
      { id: "p2", nombre: "Cerveza Club Colombia", cantidad: 3, precio: 8000, categoria: "bebida", observacion: "" },
    ],
    total: 68000,
  },
  {
    id: 2, nombre: "Mesa 2", ocupada: true, estado: "ocupada",
    pedido: [
      { id: "p3", nombre: "Pizza personal", cantidad: 1, precio: 28000, categoria: "comida", observacion: "Borde relleno" },
      { id: "p4", nombre: "Jugo de naranja", cantidad: 2, precio: 7000, categoria: "bebida", observacion: "" },
      { id: "p5", nombre: "Ensalada César", cantidad: 1, precio: 18000, categoria: "comida", observacion: "" },
    ],
    total: 60000,
  },
  {
    id: 3, nombre: "Mesa 3", ocupada: false, estado: "libre",
    pedido: [], total: 0,
  },
  {
    id: 4, nombre: "Mesa 4", ocupada: true, estado: "ocupada",
    pedido: [
      { id: "p6", nombre: "Churrasco 300g", cantidad: 1, precio: 48000, categoria: "comida", observacion: "Término 3/4" },
      { id: "p7", nombre: "Agua con gas", cantidad: 2, precio: 4500, categoria: "bebida", observacion: "" },
    ],
    total: 57000,
  },
  {
    id: 5, nombre: "Mesa 5", ocupada: false, estado: "libre",
    pedido: [], total: 0,
  },
  {
    id: 6, nombre: "Mesa 6", ocupada: true, estado: "ocupada",
    pedido: [
      { id: "p8", nombre: "Mojito",    cantidad: 2, precio: 18000, categoria: "bebida", observacion: "" },
      { id: "p9", nombre: "Nachos con guacamole", cantidad: 1, precio: 16000, categoria: "comida", observacion: "" },
    ],
    total: 52000,
  },
  {
    id: 7, nombre: "Mesa 7", ocupada: false, estado: "libre",
    pedido: [], total: 0,
  },
  {
    id: 8, nombre: "Mesa 8", ocupada: true, estado: "ocupada",
    pedido: [
      { id: "p10", nombre: "Bandeja paisa",  cantidad: 1, precio: 32000, categoria: "comida", observacion: "" },
      { id: "p11", nombre: "Gaseosa",        cantidad: 2, precio: 5000,  categoria: "bebida", observacion: "" },
    ],
    total: 42000,
  },
  {
    id: 9,  nombre: "Mesa 9",  ocupada: false, estado: "libre", pedido: [], total: 0 },
  {
    id: 10, nombre: "Mesa 10", ocupada: false, estado: "libre", pedido: [], total: 0 },
];

// ── HELPERS INTERNOS ─────────────────────────────────────────────

/** Recalcula el total de una mesa en base a su pedido */
const recalcularTotal = (pedido = []) =>
  pedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

/** Genera un ID único para nuevas mesas */
const generarIdMesa = (mesas) => {
  const maxId = mesas.reduce((max, m) => Math.max(max, m.id), 0);
  return maxId + 1;
};

/** Genera un ID único para items de pedido */
const generarIdItem = () =>
  `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── API PÚBLICA ──────────────────────────────────────────────────

/** Carga las mesas desde localStorage. Si no hay datos, usa los de prueba */
export const cargarMesas = () => {
  const guardadas = getItem(KEYS.MESAS, null);
  if (guardadas && guardadas.length > 0) return guardadas;
  // Primera vez: persistir datos de prueba
  setItem(KEYS.MESAS, DATOS_PRUEBA);
  return DATOS_PRUEBA;
};

/** Persiste el arreglo de mesas en localStorage */
export const guardarMesas = (mesas) => setItem(KEYS.MESAS, mesas);

/** Crea una nueva mesa vacía y la agrega al arreglo */
export const crearMesa = (mesas, nombre) => {
  const id = generarIdMesa(mesas);
  const nueva = {
    id,
    nombre: nombre || `Mesa ${id}`,
    ocupada: false,
    estado: "libre",
    pedido: [],
    total: 0,
  };
  return [...mesas, nueva];
};

/** Elimina una mesa por su id (solo si está libre) */
export const eliminarMesa = (mesas, idMesa) =>
  mesas.filter((m) => m.id !== idMesa);

/** Modifica la cantidad de un ítem en el pedido de una mesa.
 *  Si la cantidad llega a 0, elimina el ítem.
 *  Retorna la mesa actualizada. */
export const modificarCantidadItem = (mesa, indexItem, delta) => {
  const items = [...mesa.pedido];
  const nuevaCantidad = Math.max(0, items[indexItem].cantidad + delta);

  if (nuevaCantidad === 0) {
    items.splice(indexItem, 1);
  } else {
    items[indexItem] = { ...items[indexItem], cantidad: nuevaCantidad };
  }

  return {
    ...mesa,
    pedido: items,
    total: recalcularTotal(items),
    ocupada: items.length > 0,
    estado: items.length > 0 ? "ocupada" : "libre",
  };
};

/** Aplica un pago total a la mesa: limpia el pedido y la libera */
export const aplicarPagoTotal = (mesa) => ({
  ...mesa,
  pedido: [],
  total: 0,
  ocupada: false,
  estado: "libre",
});

/** Aplica un pago parcial (división): elimina los ítems pagados.
 *  @param {string[]} nombresPagados — nombres de los ítems seleccionados */
export const aplicarPagoParcial = (mesa, nombresPagados) => {
  const restante = mesa.pedido.filter(
    (item) => !nombresPagados.includes(item.nombre)
  );
  return {
    ...mesa,
    pedido: restante,
    total: recalcularTotal(restante),
    ocupada: restante.length > 0,
    estado: restante.length > 0 ? "ocupada" : "libre",
  };
};

/** Reemplaza una mesa dentro del arreglo (por id) */
export const actualizarMesaEnArreglo = (mesas, mesaActualizada) =>
  mesas.map((m) => (m.id === mesaActualizada.id ? mesaActualizada : m));