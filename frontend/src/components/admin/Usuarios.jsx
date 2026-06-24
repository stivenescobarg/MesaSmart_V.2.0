// frontend/src/components/admin/Usuarios.jsx

import { useState } from "react";
import Modal from "./Modal";

const PASSWORD_SEGURIDAD = "9876";

const ROLES = [
  { value: "cocina",    label: "🍳 Cocina" },
  { value: "bartender", label: "🍹 Bartender" },
  { value: "admin",     label: "🛡️ Administrador" },
];

const COLOR_ROL = {
  cocina:    "chip-naranja",
  bartender: "chip-azul",
  admin:     "chip-morado",
};

const etiquetaRol = (rol) =>
  ({ admin: "Administrador", cocina: "Cocina", bartender: "Bartender" }[rol] || rol);

const validarFormulario = (correo, password, confirmar) => {
  const errores = [];
  if (!correo.includes("@"))  errores.push("El correo no tiene un formato válido.");
  if (password.length < 6)    errores.push("La contraseña debe tener al menos 6 caracteres.");
  if (password !== confirmar)  errores.push("Las contraseñas no coinciden.");
  return errores;
};

const Usuarios = ({ usuarios, onCrearUsuario, onEliminarUsuario }) => {
  const [formulario,       setFormulario]       = useState(false);
  const [correo,           setCorreo]           = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmar,        setConfirmar]        = useState("");
  const [rol,              setRol]              = useState("cocina");
  const [errores,          setErrores]          = useState([]);
  const [mostrarPass,      setMostrarPass]      = useState(false);
  const [modalEliminar,    setModalEliminar]    = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [passSeguridad,    setPassSeguridad]    = useState("");
  const [errorModal,       setErrorModal]       = useState("");
  const [eliminando,       setEliminando]       = useState(false);

  const limpiarFormulario = () => {
    setCorreo(""); setPassword(""); setConfirmar("");
    setRol("cocina"); setErrores([]); setFormulario(false);
  };

  const handleCrear = () => {
    const errs = validarFormulario(correo, password, confirmar);
    if (errs.length > 0) { setErrores(errs); return; }
    onCrearUsuario({ correo, password, rol });
    limpiarFormulario();
  };

  const abrirModalEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setPassSeguridad("");
    setErrorModal("");
    setModalEliminar(true);
  };

  // FIX BUG 3: esperar la promesa del padre y capturar errores del backend
  const confirmarEliminar = async () => {
    if (passSeguridad !== PASSWORD_SEGURIDAD) {
      setErrorModal("Contraseña de seguridad incorrecta.");
      return;
    }

    // FIX: verificar que el id exista y sea válido
    const idUsuario = usuarioAEliminar?.id;
    if (!idUsuario) {
      setErrorModal("No se pudo identificar el usuario. Recarga la página.");
      return;
    }

    setEliminando(true);
    setErrorModal("");

    try {
      // FIX: await para esperar la respuesta real del backend
      await onEliminarUsuario(idUsuario);
      // Solo cerrar el modal si el backend respondió OK
      setModalEliminar(false);
      setUsuarioAEliminar(null);
      setPassSeguridad("");
    } catch (err) {
      // Si el backend responde con error, mostrarlo en el modal
      setErrorModal(err.message || "Error al eliminar. Intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Gestión de usuarios</h2>
        <span className="chip chip-neutro">{usuarios.length} usuario(s)</span>
      </div>

      {!formulario && (
        <button className="btn-secundario" onClick={() => setFormulario(true)}>
          + Nuevo usuario
        </button>
      )}

      {/* ── FORMULARIO CREAR ── */}
      {formulario && (
        <div className="admin-card formulario-usuario">
          <h3 className="subtitulo">Crear nuevo usuario</h3>

          {errores.length > 0 && (
            <div className="alerta-error">
              {errores.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}

          <div className="campo-grupo">
            <label className="campo-label">Correo electrónico</label>
            <input className="campo-input" type="email"
              placeholder="usuario@mesasmart.com"
              value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Contraseña (mín. 6 caracteres)</label>
            <div className="input-con-icono">
              <input className="campo-input"
                type={mostrarPass ? "text" : "password"}
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} />
              <button className="btn-toggle-pass" type="button"
                onClick={() => setMostrarPass(!mostrarPass)}>
                {mostrarPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Confirmar contraseña</label>
            <input className="campo-input" type="password"
              placeholder="••••••••" value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)} />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Rol del usuario</label>
            <div className="rol-selector">
              {ROLES.map(({ value, label }) => (
                <button key={value} type="button"
                  className={`btn-rol ${rol === value ? "activo" : ""}`}
                  onClick={() => setRol(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-botones">
            <button className="btn-primario" onClick={handleCrear}>Crear usuario</button>
            <button className="btn-ghost" onClick={limpiarFormulario}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── LISTA ── */}
      <div className="usuarios-lista">
        {usuarios.length === 0 ? (
          <p className="texto-secundario" style={{ marginTop: "1.5rem" }}>
            No hay usuarios registrados.
          </p>
        ) : (
          usuarios.map((u) => (
            <div key={u.id} className="usuario-row">
              <div className="usuario-info">
                <span className="usuario-correo">{u.correo}</span>
                <span className={`chip ${COLOR_ROL[u.rol] || "chip-neutro"}`}>
                  {etiquetaRol(u.rol)} {u.numero ? `#${u.numero}` : ""}
                </span>
              </div>
              <div className="usuario-meta">
                {u.creado_en && (
                  <span className="texto-muted usuario-fecha">
                    {new Date(u.creado_en).toLocaleDateString("es-CO")}
                  </span>
                )}
                <button className="btn-eliminar"
                  onClick={() => abrirModalEliminar(u)}
                  title="Eliminar usuario">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── MODAL ELIMINACIÓN ── */}
      <Modal
        abierto={modalEliminar}
        titulo="Eliminar usuario"
        variante="peligro"
        labelConfirmar={eliminando ? "Eliminando..." : "Eliminar"}
        labelCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return; // no cerrar mientras procesa
          setModalEliminar(false);
          setUsuarioAEliminar(null);
        }}
      >
        {usuarioAEliminar && (
          <div>
            <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
              Vas a eliminar a{" "}
              <strong style={{ color: "var(--text-1)" }}>
                {usuarioAEliminar.correo}
              </strong>. Esta acción no se puede deshacer.
            </p>
            <div className="campo-grupo">
              <label className="campo-label">Contraseña de seguridad</label>
              <input
                className="campo-input"
                type="password"
                placeholder="Ingresa la contraseña de seguridad"
                value={passSeguridad}
                onChange={(e) => { setPassSeguridad(e.target.value); setErrorModal(""); }}
                onKeyDown={(e) => e.key === "Enter" && confirmarEliminar()}
                autoFocus
              />
            </div>
            {errorModal && (
              <p style={{ color: "var(--red)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                ⚠️ {errorModal}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Usuarios;