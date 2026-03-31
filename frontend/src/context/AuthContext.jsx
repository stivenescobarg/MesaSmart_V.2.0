// ══════════════════════════════════════════════════════════════════
// context/AuthContext.jsx
// Estado global de autenticación.
// Provee: usuario activo, sesión, funciones login/logout.
// Consumir con: const { usuario, sesion, login, logout } = useAuth();
// ══════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi }   from "../services/api/authApi";
import {
  iniciarSesion,
  cerrarSesion,
  getSesionActiva,
  limpiarSesionesHuerfanas,
} from "../services/authService";

// ── CONTEXTO ─────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── PROVIDER ──────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario]   = useState(null);
  const [sesion,  setSesion]    = useState(null);
  const [cargando, setCargando] = useState(true); // mientras se verifica sesión persistida

  // Al montar: recuperar sesión persistida (por si el usuario recargó la página)
  useEffect(() => {
    limpiarSesionesHuerfanas();
    const persistida = getSesionActiva();
    if (persistida) {
      setUsuario(persistida.usuario);
      setSesion(persistida.sesion);
    }
    setCargando(false);
  }, []);

  /**
   * Inicia sesión con correo + password.
   * @returns {{ ok: boolean, error?: string }}
   */
  const login = async (correo, password) => {
    const resultado = await loginApi(correo, password);
    if (!resultado.ok) return resultado;

    const nuevaSesion = iniciarSesion(resultado.usuario);
    setUsuario(resultado.usuario);
    setSesion(nuevaSesion);
    return { ok: true };
  };

  /**
   * Cierra la sesión actual y limpia el estado.
   */
  const logout = () => {
    if (sesion?.id) cerrarSesion(sesion.id);
    setUsuario(null);
    setSesion(null);
  };

  /** Nombre de bienvenida formateado */
  const saludo = usuario
    ? `${usuario.correo.split("@")[0]} (${etiquetaRol(usuario.rol)})`
    : "";

  return (
    <AuthContext.Provider
      value={{ usuario, sesion, login, logout, cargando, saludo }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── HOOK ──────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

// ── HELPERS ───────────────────────────────────────────────────────
const etiquetaRol = (rol) => {
  const map = {
    administrador: "Administrador",
    cocina:        "Cocina",
    bartender:     "Bartender",
  };
  return map[rol] || rol;
};