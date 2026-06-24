// frontend/src/context/AuthContext.jsx
// LIMPIO: solo consume authService que llama al backend.
// El token se guarda en localStorage (solo el token, no datos de negocio).

import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar: verificar token guardado llamando al backend
  useEffect(() => {
    authService.verificarSesion()
      .then((u) => setUsuario(u))
      .finally(() => setCargando(false));
  }, []);

  const login = async (correo, password) => {
    try {
      const data = await authService.login(correo, password);
      setUsuario(data.usuario);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUsuario(null);
  };

  // Saludo usa el rol real de la BD: "admin", "cocina", "bartender"
  const saludo = usuario
    ? `${usuario.correo.split("@")[0]} (${etiquetaRol(usuario.rol)})`
    : "";

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, saludo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

// Roles de la BD: "admin", "cocina", "bartender"
const etiquetaRol = (rol) =>
  ({ admin: "Administrador", cocina: "Cocina", bartender: "Bartender" }[rol] || rol);