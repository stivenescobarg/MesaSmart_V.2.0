// ══════════════════════════════════════════════════════════════════
// hooks/useBeforeUnload.js
// Muestra una confirmación nativa del navegador si el usuario
// intenta cerrar la pestaña, recargar o navegar fuera.
// Solo activo cuando "activo" es true.
// ══════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @param {boolean} activo — activar/desactivar la protección
 */
export const useBeforeUnload = (activo = true) => {
  // Protege cierre de pestaña / recarga
  useEffect(() => {
    if (!activo) return;

    const handler = (e) => {
      e.preventDefault();
      // Chrome requiere returnValue, otros navegadores usan el return
      e.returnValue = "¿Seguro que deseas salir? Perderás el progreso actual.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activo]);
};

/**
 * Intercepta el botón "atrás" del navegador.
 * Al detectarlo, ejecuta onBack() en lugar de navegar.
 * @param {boolean} activo
 * @param {() => void} onBack — qué hacer cuando el usuario presiona atrás
 */
export const useBlockBack = (activo = true, onBack) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!activo) return;

    // Empujar un estado falso para detectar el "atrás"
    window.history.pushState(null, "", window.location.href);

    const handler = () => {
      // El usuario presionó "atrás" → ejecutamos nuestra lógica
      window.history.pushState(null, "", window.location.href);
      if (onBack) onBack();
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [activo, onBack]);
};