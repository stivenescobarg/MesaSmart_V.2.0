// ══════════════════════════════════════════════════════════════════
// useToast.js — Sistema de notificaciones visuales sin librerías
// Reemplaza todos los alert() por mensajes en pantalla
// ══════════════════════════════════════════════════════════════════

import { useState, useCallback } from "react";

/** Tipos disponibles de toast */
export const TOAST_TIPOS = {
  EXITO:      "exito",
  ERROR:      "error",
  ADVERTENCIA:"advertencia",
  INFO:       "info",
};

let nextId = 0;

/**
 * Hook que expone `toasts` (array) y las funciones para mostrarlos.
 *
 * Uso:
 *   const { toasts, toast, ToastContainer } = useToast();
 *   toast.exito("¡Pago registrado!");
 *   // En el JSX: <ToastContainer toasts={toasts} />
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const agregar = useCallback((mensaje, tipo = TOAST_TIPOS.INFO, duracion = 3500) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracion);
  }, []);

  const remover = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    remover,
    toast: {
      exito:       (msg) => agregar(msg, TOAST_TIPOS.EXITO),
      error:       (msg) => agregar(msg, TOAST_TIPOS.ERROR),
      advertencia: (msg) => agregar(msg, TOAST_TIPOS.ADVERTENCIA),
      info:        (msg) => agregar(msg, TOAST_TIPOS.INFO),
    },
  };
};