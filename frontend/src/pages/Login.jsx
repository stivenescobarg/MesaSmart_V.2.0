import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("admin");

  // 🔥 CREAR USUARIOS INICIALES
  useEffect(() => {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.length === 0) {
      const iniciales = [
        {
          correo: "admin@mesasmart.com",
          password: "admin123",
          rol: "admin",
          numero: 1,
        },
        {
          correo: "cocina@mesasmart.com",
          password: "cocina123",
          rol: "cocina",
          numero: 1,
        },
        {
          correo: "bar@mesasmart.com",
          password: "bar123",
          rol: "bartender",
          numero: 1,
        },
      ];

      localStorage.setItem("users", JSON.stringify(iniciales));
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    // 🔍 Buscar usuario por correo
    const user = users.find((u) => u.correo === correo);

    if (!user) {
      alert("Usuario no encontrado ❌");
      return;
    }

    // 🔒 Validar contraseña
    if (user.password !== password) {
      alert("Contraseña incorrecta ❌");
      return;
    }

    // 🚫 VALIDAR ROL OBLIGATORIO
    if (user.rol !== rol) {
      alert(`Este usuario pertenece al rol: ${user.rol} ❌`);
      return;
    }

    // ✅ REDIRECCIÓN CORRECTA
    if (rol === "admin") {
      navigate("/admin");
    }

    if (rol === "cocina") {
      navigate(`/kitchen/${user.numero}`);
    }

    if (rol === "bartender") {
      navigate(`/bartender/${user.numero}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <img
          src="https://picsum.photos/400/180"
          alt="banner"
          className="login-img"
        />

        <h1 className="title">Hola de nuevo </h1>

        <form onSubmit={handleLogin}>

          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <p className="rol-title">Selecciona tu rol</p>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="admin">Administrador</option>
            <option value="cocina">Cocina</option>
            <option value="bartender">Bartender</option>
          </select>

          <button type="submit">Iniciar sesión</button>

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