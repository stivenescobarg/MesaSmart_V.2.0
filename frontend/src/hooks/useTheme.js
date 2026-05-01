// frontend/src/hooks/useTheme.js
// Gestiona el tema claro/oscuro.
// Persiste la preferencia en localStorage.
// Agrega/quita la clase "light-mode" en el <html> para que
// los CSS variables cambien globalmente.

import { useState, useEffect } from "react";

const THEME_KEY = "ms_theme";

export const useTheme = () => {
  const [esOscuro, setEsOscuro] = useState(() => {
    const guardado = localStorage.getItem(THEME_KEY);
    if (guardado) return guardado === "dark";
    // Detectar preferencia del sistema
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (esOscuro) {
      html.classList.remove("light-mode");
    } else {
      html.classList.add("light-mode");
    }
    localStorage.setItem(THEME_KEY, esOscuro ? "dark" : "light");
  }, [esOscuro]);

  const toggleThema = () => setEsOscuro((v) => !v);

  return { esOscuro, toggleThema };
};