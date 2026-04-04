// frontend/src/services/egresoService.js
import { api } from "./api";

export const egresoService = {
  getActuales:  ()                        => api.get("/egresos"),
  crear:        ({ descripcion, monto })  => api.post("/egresos", { descripcion, monto }),
};