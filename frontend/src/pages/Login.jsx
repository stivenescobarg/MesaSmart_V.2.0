// ══════════════════════════════════════════════════════════════════
// pages/Login.jsx
// - Usuarios quemados que se crean automáticamente si no existen
// - Compatible con AMBAS claves: "users" (original) y "ms_users" (nuevo)
// - Rutas originales: /admin, /kitchen/1, /bartender/1, /menu
// - Sin selección de rol: el sistema lo detecta por las credenciales
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoMesaSmart from "../assets/Logo-MesaSmart.png";
import "./Login.css";

// ── USUARIOS QUEMADOS ────────────────────────────────────────────
// Se crean en AMBAS claves para compatibilidad total con el proyecto
const USUARIOS_INICIALES = [
  { correo: "admin@mesasmart.com",  password: "admin123",  rol: "administrador", numero: 1 },
  { correo: "cocina@mesasmart.com", password: "cocina123", rol: "cocina",         numero: 1 },
  { correo: "bar@mesasmart.com",    password: "bar123",    rol: "bartender",      numero: 1 },
];

// Hash simple — mismo algoritmo que userService.js
const SALT = "ms_2026_salt";
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
const hashPassword = (pwd) => hashString(SALT + pwd + SALT);

const inicializarUsuarios = () => {
  // ── Clave nueva (ms_users) — usada por authService / userService ──
  const msUsers = JSON.parse(localStorage.getItem("ms_users") || "[]");
  if (msUsers.length === 0) {
    const nuevos = USUARIOS_INICIALES.map((u) => ({
      id:           `u_${u.rol}_inicial`,
      correo:       u.correo,
      passwordHash: hashPassword(u.password),
      rol:          u.rol,
      numero:       u.numero,
      creadoEn:     new Date().toISOString(),
    }));
    localStorage.setItem("ms_users", JSON.stringify(nuevos));
  }

  // ── Clave original (users) — usada por los otros módulos del proyecto ──
  const oldUsers = JSON.parse(localStorage.getItem("users") || "[]");
  if (oldUsers.length === 0) {
    localStorage.setItem("users", JSON.stringify(
      USUARIOS_INICIALES.map((u) => ({
        correo:  u.correo,
        password: u.password,
        rol:     u.rol === "administrador" ? "admin" : u.rol,
        numero:  u.numero,
      }))
    ));
  }
};

// ── REDIRECCIÓN POR ROL ───────────────────────────────────────────
const getRutaPorRol = (usuario) => {
  switch (usuario.rol) {
    case "administrador":
    case "admin":
      return "/admin";
    case "cocina":
      return `/kitchen/${usuario.numero || 1}`;
    case "bartender":
      return `/bartender/${usuario.numero || 1}`;
    default:
      return "/admin";
  }
};

// ── COMPONENTE ────────────────────────────────────────────────────
const Login = () => {
  const navigate          = useNavigate();
  const { login, usuario, cargando } = useAuth();

  const [correo,       setCorreo]       = useState("");
  const [password,     setPassword]     = useState("");
  const [error,        setError]        = useState("");
  const [cargandoBtn,  setCargandoBtn]  = useState(false);
  const [mostrarPass,  setMostrarPass]  = useState(false);

  // Crear usuarios iniciales si no existen
  useEffect(() => {
    inicializarUsuarios();
  }, []);

  // Si ya hay sesión activa → redirigir al panel del rol
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
      setError("Correo o contraseña incorrectos ❌");
      setCargandoBtn(false);
      return;
    }
    // La redirección la maneja el useEffect cuando `usuario` cambia
  };

  if (cargando) return null;
  if (usuario)  return null;

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Banner */}
        <img
          src={logoMesaSmart}
          alt="banner"
          className="login-img"
        />

        <h1 className="title">MesaSmart</h1>

        <form onSubmit={handleLogin}>

          {error && (
            <div className="login-error" role="alert">{error}</div>
          )}

          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => { setCorreo(e.target.value); setError(""); }}
            placeholder="usuario@mesasmart.com"
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

        {/* Credenciales de prueba visibles en desarrollo */}
       

        <div className="about">
          Sobre nosotros: Sistema MesaSmart para gestión de restaurante.
        </div>
      </div>
    </div>
  );
};

export default Login;