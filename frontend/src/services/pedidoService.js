// frontend/src/services/pedidoService.js
import { api } from "./api";

export const pedidoService = {
  crear:        (data)            => api.post("/pedidos", data),
  getByMesa:    (mesa_id)         => api.get(`/pedidos/mesa/${mesa_id}`),
  updateEstado: (id, estado)      => api.patch(`/pedidos/${id}/estado`, { estado }),
  updateItem:   (item_id, cantidad) => api.patch(`/pedidos/items/${item_id}`, { cantidad }),
};