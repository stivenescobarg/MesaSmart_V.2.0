// frontend/src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoMesaSmart from "../assets/Logo-MesaSmart.png";
import "./Login.css";

const getRutaPorRol = (usuario) => {
  switch (usuario.rol) {
    case "super_admin": return "/super-admin";
    case "admin":      return "/admin";
    case "cocina":     return `/kitchen/${usuario.numero || 1}`;
    case "bartender":  return `/bartender/${usuario.numero || 1}`;
    default:           return "/admin";
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { login, usuario, cargando } = useAuth();

  const [correo,      setCorreo]      = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState("");
  const [cargandoBtn, setCargandoBtn] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const errorTimerRef = useRef(null);

  useEffect(() => {
    if (!cargando && usuario) {
      navigate(getRutaPorRol(usuario), { replace: true });
    }
  }, [usuario, cargando, navigate]);

  // Autolimpia el error después de un tiempo, pero solo por React,
  // nunca por un reload o navegación externa.
  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(""), 6000);
    }
    return () => clearTimeout(errorTimerRef.current);
  }, [error]);

  const handleLogin = async (e) => {
    e?.preventDefault();

    const correoLimpio = correo.trim();

    if (!correoLimpio || !password) {
      setError("Completa todos los campos.");
      return;
    }
    if (!EMAIL_REGEX.test(correoLimpio)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setCargandoBtn(true);
    setError("");

    try {
      const resultado = await login(correoLimpio, password);
      if (!resultado.ok) {
        setError(resultado.error || "Correo o contraseña incorrectos.");
      }
      // Si ok=true, el useEffect de arriba redirige.
    } catch (err) {
      // Si login() llegara a lanzar en vez de devolver {ok:false},
      // lo atrapamos aquí para que NUNCA se propague a un reload.
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargandoBtn(false);
    }
  };

  if (cargando) return null;
  if (usuario)  return null;

  return (
    <div className="login-container">
      <div className="login-card">

        <img src={logoMesaSmart} alt="Logo MesaSmart" className="login-img" />

        <form onSubmit={handleLogin} noValidate>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">!</span>
              <span className="login-error-text">{error}</span>
              <button
                type="button"
                className="login-error-close"
                onClick={() => setError("")}
                aria-label="Cerrar aviso"
              >
                ×
              </button>
            </div>
          )}

          <label>Correo</label>
          <input
            type="text"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); }}
            placeholder="usuario@mesasmart.com"
            autoComplete="username"
            autoFocus
          />

          <label>Contraseña</label>
          <div className="input-con-icono">
            <input
              type={mostrarPass ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
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
            onClick={() => navigate("/menu/1/1")}
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