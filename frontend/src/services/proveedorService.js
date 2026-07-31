// frontend/src/services/proveedorService.js
import { api } from "./api";

export const proveedorService = {
  getAll: ({ estado, categoria, busqueda } = {}) => {
    const params = new URLSearchParams();
    if (estado)    params.set("estado", estado);
    if (categoria) params.set("categoria", categoria);
    if (busqueda)  params.set("busqueda", busqueda);
    const qs = params.toString();
    return api.get(`/proveedores${qs ? `?${qs}` : ""}`);
  },

  getById:        (id)           => api.get(`/proveedores/${id}`),
  crear:          (data)         => api.post("/proveedores", data),
  actualizar:     (id, data)     => api.put(`/proveedores/${id}`, data), // requiere agregar api.put (ver CAMBIOS_API_JS.txt)
  cambiarEstado:  (id, estado)   => api.patch(`/proveedores/${id}/estado`, { estado }),
  eliminar:       (id)           => api.delete(`/proveedores/${id}`),
};
