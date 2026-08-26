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

const validarFormulario = (nombre, correo, correoPersonal, telefono, password, confirmar) => {
  const errores = [];
  if (!nombre.trim())                errores.push("El nombre completo es obligatorio.");
  if (!correo.includes("@"))         errores.push("El correo del sistema no tiene un formato válido.");
  if (!correoPersonal.includes("@")) errores.push("El correo personal no tiene un formato válido.");
  if (!/^\d{7,15}$/.test(telefono))  errores.push("El número de teléfono no es válido.");
  if (password.length < 6)           errores.push("La contraseña debe tener al menos 6 caracteres.");
  if (password !== confirmar)        errores.push("Las contraseñas no coinciden.");
  return errores;
};

// activo puede venir como 1/0 (tinyint de MySQL) o true/false
const esActivo = (u) => u.activo === 1 || u.activo === true || u.activo === "1";

const Usuarios = ({ usuarios, onCrearUsuario, onEliminarUsuario }) => {
  const [formulario,       setFormulario]       = useState(false);
  const [nombre,           setNombre]           = useState("");
  const [correo,           setCorreo]           = useState("");
  const [correoPersonal,   setCorreoPersonal]   = useState("");
  const [telefono,         setTelefono]         = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmar,        setConfirmar]        = useState("");
  const [rol,              setRol]              = useState("cocina");
  const [errores,          setErrores]          = useState([]);
  const [creando,          setCreando]          = useState(false);
  const [mostrarPass,      setMostrarPass]      = useState(false);
  const [expandidoId,      setExpandidoId]      = useState(null);
  const [pestana,          setPestana]          = useState("activos"); // "activos" | "desactivados"
  const [modalDesactivar,  setModalDesactivar]  = useState(false);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState(null);
  const [passSeguridad,    setPassSeguridad]    = useState("");
  const [errorModal,       setErrorModal]       = useState("");
  const [desactivando,     setDesactivando]     = useState(false);

  const activos       = usuarios.filter(esActivo);
  const desactivados  = usuarios.filter((u) => !esActivo(u));
  const listaVisible  = pestana === "activos" ? activos : desactivados;

  const limpiarFormulario = () => {
    setNombre(""); setCorreo(""); setCorreoPersonal(""); setTelefono("");
    setPassword(""); setConfirmar("");
    setRol("cocina"); setErrores([]); setFormulario(false);
  };

  const handleCrear = async () => {
    const errs = validarFormulario(nombre, correo, correoPersonal, telefono, password, confirmar);
    if (errs.length > 0) { setErrores(errs); return; }

    setCreando(true);
    setErrores([]);
    try {
      await onCrearUsuario({
        nombre,
        correo,
        correo_personal: correoPersonal,
        telefono,
        password,
        rol,
      });
      limpiarFormulario(); // solo se cierra/limpia si no hubo error
    } catch (err) {
      setErrores([err.message || "Error al crear el usuario."]);
      // el formulario se queda abierto con lo que ya escribió
    } finally {
      setCreando(false);
    }
  };

  const toggleExpandir = (id) => {
    setExpandidoId((actual) => (actual === id ? null : id));
  };

  const abrirModalDesactivar = (usuario) => {
    setUsuarioADesactivar(usuario);
    setPassSeguridad("");
    setErrorModal("");
    setModalDesactivar(true);
  };

  const confirmarDesactivar = async () => {
    if (passSeguridad !== PASSWORD_SEGURIDAD) {
      setErrorModal("Contraseña de seguridad incorrecta.");
      return;
    }

    const idUsuario = usuarioADesactivar?.id;
    if (!idUsuario) {
      setErrorModal("No se pudo identificar el usuario. Recarga la página.");
      return;
    }

    setDesactivando(true);
    setErrorModal("");

    try {
      await onEliminarUsuario(idUsuario);
      setModalDesactivar(false);
      setUsuarioADesactivar(null);
      setPassSeguridad("");
    } catch (err) {
      setErrorModal(err.message || "Error al desactivar. Intenta de nuevo.");
    } finally {
      setDesactivando(false);
    }
  };

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Gestión de usuarios</h2>
        <span className="chip chip-neutro">{activos.length} activo(s)</span>
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
            <label className="campo-label">Nombre completo</label>
            <input className="campo-input" type="text"
              placeholder="Juan Pérez"
              value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Correo del sistema</label>
            <input className="campo-input" type="email"
              placeholder="usuario@mesasmart.com"
              value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Correo personal</label>
            <input className="campo-input" type="email"
              placeholder="correo.personal@gmail.com"
              value={correoPersonal} onChange={(e) => setCorreoPersonal(e.target.value)} />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Número de teléfono</label>
            <input className="campo-input" type="tel"
              placeholder="3001234567"
              value={telefono} onChange={(e) => setTelefono(e.target.value)} />
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
            <button className="btn-primario" onClick={handleCrear} disabled={creando}>
              {creando ? "Creando..." : "Crear usuario"}
            </button>
            <button className="btn-ghost" onClick={limpiarFormulario}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── PESTAÑAS ── */}
      <div className="rol-selector" style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
        <button type="button"
          className={`btn-rol ${pestana === "activos" ? "activo" : ""}`}
          onClick={() => setPestana("activos")}>
          Activos ({activos.length})
        </button>
        <button type="button"
          className={`btn-rol ${pestana === "desactivados" ? "activo" : ""}`}
          onClick={() => setPestana("desactivados")}>
          Desactivados ({desactivados.length})
        </button>
      </div>

      {/* ── LISTA ── */}
      <div className="usuarios-lista">
        {listaVisible.length === 0 ? (
          <p className="texto-secundario" style={{ marginTop: "1.5rem" }}>
            {pestana === "activos"
              ? "No hay usuarios activos."
              : "No hay usuarios desactivados."}
          </p>
        ) : (
          listaVisible.map((u) => {
            const expandido = expandidoId === u.id;
            return (
              <div key={u.id} className="usuario-item">
                <div
                  className="usuario-row"
                  onClick={() => toggleExpandir(u.id)}
                  style={{ cursor: "pointer", opacity: esActivo(u) ? 1 : 0.6 }}
                  title="Ver información completa"
                >
                  <div className="usuario-info">
                    <span className="usuario-correo">{u.correo}</span>
                    <span className={`chip ${COLOR_ROL[u.rol] || "chip-neutro"}`}>
                      {etiquetaRol(u.rol)} {u.numero ? `#${u.numero}` : ""}
                    </span>
                    {!esActivo(u) && (
                      <span className="chip chip-neutro">Desactivado</span>
                    )}
                  </div>
                  <div className="usuario-meta">
                    {u.creado_en && (
                      <span className="texto-muted usuario-fecha">
                        {new Date(u.creado_en).toLocaleDateString("es-CO")}
                      </span>
                    )}
                    <span className="texto-muted" style={{ fontSize: "0.75rem" }}>
                      {expandido ? "▲" : "▼"}
                    </span>
                    {esActivo(u) && (
                      <button className="btn-eliminar"
                        onClick={(e) => { e.stopPropagation(); abrirModalDesactivar(u); }}
                        title="Desactivar usuario">✕</button>
                    )}
                  </div>
                </div>

                {expandido && (
                  <div className="admin-card usuario-detalle" style={{ marginTop: "0.5rem" }}>
                    <p><strong>Nombre completo:</strong> {u.nombre || "—"}</p>
                    <p><strong>Correo del sistema:</strong> {u.correo}</p>
                    <p><strong>Correo personal:</strong> {u.correo_personal || "—"}</p>
                    <p><strong>Teléfono:</strong> {u.telefono || "—"}</p>
                    <p><strong>Rol:</strong> {etiquetaRol(u.rol)}</p>
                    <p><strong>Estado:</strong> {esActivo(u) ? "Activo" : "Desactivado"}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL DESACTIVACIÓN ── */}
      <Modal
        abierto={modalDesactivar}
        titulo="Desactivar usuario"
        variante="peligro"
        labelConfirmar={desactivando ? "Desactivando..." : "Desactivar"}
        labelCancelar="Cancelar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => {
          if (desactivando) return; // no cerrar mientras procesa
          setModalDesactivar(false);
          setUsuarioADesactivar(null);
        }}
      >
        {usuarioADesactivar && (
          <div>
            <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
              Vas a desactivar a{" "}
              <strong style={{ color: "var(--text-1)" }}>
                {usuarioADesactivar.correo}
              </strong>. El usuario no podrá volver a iniciar sesión. Quedará como constancia
              en la pestaña "Desactivados", no se elimina de la base de datos.
            </p>
            <div className="campo-grupo">
              <label className="campo-label">Contraseña de seguridad</label>
              <input
                className="campo-input"
                type="password"
                placeholder="Ingresa la contraseña de seguridad"
                value={passSeguridad}
                onChange={(e) => { setPassSeguridad(e.target.value); setErrorModal(""); }}
                onKeyDown={(e) => e.key === "Enter" && confirmarDesactivar()}
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