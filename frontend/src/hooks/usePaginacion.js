// frontend/src/hooks/usePaginacion.js
import { useState, useMemo, useEffect } from "react";

/**
 * Pagina cualquier arreglo en el cliente.
 * @param {Array} items - lista completa
 * @param {number} porPagina - items por página
 */
export const usePaginacion = (items = [], porPagina = 8) => {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));

  // Si la lista cambia (filtros, fetch nuevo) y la página actual
  // queda fuera de rango, la reajustamos en vez de dejarla en blanco.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [totalPaginas, pagina]);

  const itemsPagina = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return items.slice(inicio, inicio + porPagina);
  }, [items, pagina, porPagina]);

  return {
    pagina,
    totalPaginas,
    itemsPagina,
    irAPagina: setPagina,
    siguiente: () => setPagina((p) => Math.min(p + 1, totalPaginas)),
    anterior:  () => setPagina((p) => Math.max(p - 1, 1)),
  };
};