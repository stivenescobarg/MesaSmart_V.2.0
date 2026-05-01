const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const POLL_INTERVAL = 8000;

const getToken = () => localStorage.getItem("ms_token");

const http = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
    return res.json();
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
    return res.json();
  },
};

let pollingTimer = null;
const listeners  = [];

const notifyListeners = (orders) => {
  listeners.forEach(fn => fn([...orders]));
};

export const kitchenService = {
  getOrders: async () => {
    const data = await http.get('/pedidos');
    return { pedidos: Array.isArray(data) ? data : (data.pedidos || []) };
  },
  createOrder: async (payload) => {
    return http.post('/pedidos', payload);
  },
  updateOrderStatus: async (orderId, nuevoEstado) => {
    return http.patch(`/pedidos/${orderId}/estado`, { estado: nuevoEstado });
  },
  getCocineroTurno: async () => {
    return http.get('/turno/cocinero');
  },
  subscribe: (fn) => {
    listeners.push(fn);

    if (!pollingTimer) {
      pollingTimer = setInterval(async () => {
        try {
          const data = await kitchenService.getOrders();
          notifyListeners(data.pedidos || []);
        } catch (err) {
          console.warn('[kitchenService] Error en polling:', err.message);
        }
      }, POLL_INTERVAL);
    }

    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);

      if (listeners.length === 0 && pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };
  },
};