// ─────────────────────────────────────────────
// kitchenService.js
// Servicio de cocina — conectado al backend real
// Polling cada 8 segundos para detectar nuevos pedidos
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const POLL_INTERVAL = 8000; // ms

// ─── HTTP helpers ─────────────────────────────
const http = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
    return res.json();
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
    return res.json();
  },
};

// ─── Estado interno del polling ───────────────
let pollingTimer   = null;
const listeners    = [];

const notifyListeners = (orders) => {
  listeners.forEach(fn => fn([...orders]));
};

// ─── Servicio ─────────────────────────────────
export const kitchenService = {

  /**
   * Obtiene todos los pedidos activos del backend.
   * @returns {Promise<Array>}
   */
  getOrders: async () => {
    return http.get('/pedidos');
  },

  /**
   * Crea un nuevo pedido.
   * @param {{ mesa_id: number, notas?: string, items: Array }} payload
   */
  createOrder: async (payload) => {
    return http.post('/pedidos', payload);
  },

  /**
   * Actualiza el estado de un pedido.
   * @param {number} orderId
   * @param {string} nuevoEstado  - clave del estado ('en_preparacion', 'listo', etc.)
   */
  updateOrderStatus: async (orderId, nuevoEstado) => {
    return http.patch(`/pedidos/${orderId}/estado`, { estado: nuevoEstado });
  },

  /**
   * Obtiene el cocinero en turno actual (mock hasta que se implemente turnos).
   */
  getCocineroTurno: async () => {
    return http.get('/turno/cocinero');
  },

  /**
   * Suscribe un callback a actualizaciones periódicas (polling).
   * Inicia el polling si no está activo.
   * @param {Function} fn  - callback(orders: Array)
   * @returns {Function}   - unsub: llama para cancelar suscripción
   */
  subscribe: (fn) => {
    listeners.push(fn);

    // Iniciar polling solo una vez
    if (!pollingTimer) {
      pollingTimer = setInterval(async () => {
        try {
          const orders = await kitchenService.getOrders();
          notifyListeners(orders);
        } catch (err) {
          console.warn('[kitchenService] Error en polling:', err.message);
        }
      }, POLL_INTERVAL);
    }

    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);

      // Detener polling si no hay más suscriptores
      if (listeners.length === 0 && pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };
  },
};
