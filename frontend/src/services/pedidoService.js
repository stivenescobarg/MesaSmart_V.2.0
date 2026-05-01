// frontend/src/services/pedidoService.js
import { api } from "./api";

export const pedidoService = {
  crear:        (data)              => api.post("/pedidos", data),
  getByMesa:    (mesa_id)           => api.get(`/pedidos/mesa/${mesa_id}`),
  updateEstado: (id, estado)        => api.patch(`/pedidos/${id}/estado`, { estado }),
  updateItem:   (item_id, cantidad) => api.patch(`/pedidos/items/${item_id}`, { cantidad }),

  // Eliminar un item del pedido (requiere PIN en el front, el back solo elimina)
  deleteItem:   (item_id)           => api.delete(`/pedidos/items/${item_id}`),

  // Mover una lista de items a otra mesa
  moverItems:   (item_ids, mesa_destino_id) =>
    api.patch("/pedidos/items/mover", { item_ids, mesa_destino_id }),
};