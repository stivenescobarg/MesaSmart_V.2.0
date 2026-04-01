// frontend/src/services/usuarioService.js
import { api } from "./api";

export const usuarioService = {
  getAll:    ()                          => api.get("/usuarios"),
  crear:     ({ correo, password, rol }) => api.post("/usuarios", { correo, password, rol }),
  eliminar:  (id)                        => api.delete(`/usuarios/${id}`),
  getSesiones: ()                        => api.get("/usuarios/sesiones"),
};