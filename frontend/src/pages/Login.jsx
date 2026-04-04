// frontend/src/pages/Login.jsx
// LIMPIO: sin localStorage, sin hash, sin usuarios quemados.
// Solo consume el backend via AuthContext.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoMesaSmart from "../assets/Logo-MesaSmart.png";
import "./Login.css";

// Redirección según el rol que devuelve la BD
// BD usa: "admin", "cocina", "bartender"
const getRutaPorRol = (usuario) => {
  switch (usuario.rol) {
    case "admin":      return "/admin";
    case "cocina":     return `/kitchen/${usuario.numero || 1}`;
    case "bartender":  return `/bartender/${usuario.numero || 1}`;
    default:           return "/admin";
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login, usuario, cargando } = useAuth();

  const [correo,      setCorreo]      = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState("");
  const [cargandoBtn, setCargandoBtn] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  // Si ya hay sesión activa → redirigir según rol de la BD
  useEffect(() => {
    if (!cargando && usuario) {
      navigate(getRutaPorRol(usuario), { replace: true });
    }
  }, [usuario, cargando, navigate]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!correo.trim() || !password) {
      setError("Completa todos los campos.");
      return;
    }
    setCargandoBtn(true);
    setError("");

    const resultado = await login(correo.trim(), password);

    if (!resultado.ok) {
      setError(resultado.error || "Correo o contraseña incorrectos ❌");
      setCargandoBtn(false);
    }
    // Si ok=true, el useEffect de arriba redirige automáticamente
  };

  if (cargando) return null;
  if (usuario)  return null;

  return (
    <div className="login-container">
      <div className="login-card">

        <img src={logoMesaSmart} alt="Logo MesaSmart" className="login-img" />
        <h1 className="title">MesaSmart</h1>

        <form onSubmit={handleLogin}>

          {error && <div className="login-error" role="alert">{error}</div>}

          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(""); }}
            placeholder="usuario@mesasmart.com"
            autoComplete="username"
            autoFocus
          />

          <label>Contraseña</label>
          <div className="input-con-icono">
            <input
              type={mostrarPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="campo-input-pass"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn-toggle-pass"
              onClick={() => setMostrarPass(!mostrarPass)}
              tabIndex={-1}
            >
              {mostrarPass ? "🙈" : "👁"}
            </button>
          </div>

          <button type="submit" disabled={cargandoBtn}>
            {cargandoBtn ? "Verificando..." : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="btn-menu"
            onClick={() => navigate("/menu")}
          >
            Menú
          </button>

        </form>

        <div className="about">
          Sobre nosotros: Sistema MesaSmart para gestión de restaurante.
        </div>
      </div>
    </div>
  );
};

export default Login;