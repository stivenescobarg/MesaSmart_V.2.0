import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();

  const salir = () => {
    navigate("/");
  };

  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("cocina");
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("users")) || [];
    setUsuarios(data);
  }, []);

  const crearUsuario = () => {
    if (!correo || !password) return alert("Completa campos");

    const mismos = usuarios.filter((u) => u.rol === rol);
    const numero = mismos.length + 1;

    const nuevo = { correo, password, rol, numero };

    const nuevos = [...usuarios, nuevo];
    localStorage.setItem("users", JSON.stringify(nuevos));
    setUsuarios(nuevos);

    setCorreo("");
    setPassword("");
  };

  return (
    <div className="admin-container">

      <button className="btn-salir" onClick={salir}>Salir</button>

      <h1 className="panel-title">Panel de Administrador</h1>

      {!mostrarPanel ? (
        <button className="btn-abrir" onClick={() => setMostrarPanel(true)}>
          Crear usuario
        </button>
      ) : (
        <div className="admin-card">

          <h2 className="titulo-morado">Crear nuevo usuario</h2>

          <label>Correo</label>
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} />

          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} />

          <p className="rol-title">Selecciona el rol</p>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="cocina">Cocina</option>
            <option value="bartender">Bartender</option>
          </select>

          <button className="btn-crear" onClick={crearUsuario}>
            Crear usuario
          </button>

          <h3 className="titulo-morado">Usuarios creados</h3>

          {usuarios.filter(u => u.rol !== "admin").map((u, i) => (
            <p key={i}>{u.correo} - {u.password} ({u.rol} {u.numero})</p>
          ))}

          <button className="btn-volver" onClick={() => setMostrarPanel(false)}>
            Volver
          </button>

        </div>
      )}
    </div>
  );
};

export default Admin;