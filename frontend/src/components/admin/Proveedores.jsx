// frontend/src/components/admin/Proveedores.jsx
// Gestión de proveedores — mismo patrón visual que Usuarios.jsx / Stock.jsx

import { useState, useEffect, useCallback } from "react";
import { proveedorService } from "../../services/proveedorService";
import Modal from "./Modal";

const CATEGORIAS_SUGERIDAS = ["Insumos", "Bebidas", "Carnes", "Verduras", "Servicios", "Otros"];

const FORM_VACIO = {
  nombre: "", nit: "", telefono: "", correo: "",
  direccion: "", ciudad: "", categoria: "", observaciones: "",
};

const Proveedores = ({ toast }) => {
  const [proveedores, setProveedores] = useState([]);
  const [cargando,    setCargando]    = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda,     setBusqueda]     = useState("");

  // Modal crear/editar
  const [modalForm,  setModalForm]  = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = creando, id = editando
  const [form,        setForm]        = useState(FORM_VACIO);
  const [procesando,  setProcesando]  = useState(false);
  const [errores,     setErrores]     = useState([]);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroEstado !== "todos") params.estado = filtroEstado;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const data = await proveedorService.getAll(params);
      setProveedores(data.proveedores || []);
    } catch (err) {
      if (toast) toast.error("Error al cargar proveedores: " + err.message);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, busqueda]);

  useEffect(() => {
    const id = setTimeout(cargar, 300); // debounce para la búsqueda
    return () => clearTimeout(id);
  }, [cargar]);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrores([]);
    setModalForm(true);
  };

  const abrirEditar = (p) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre || "", nit: p.nit || "", telefono: p.telefono || "",
      correo: p.correo || "", direccion: p.direccion || "", ciudad: p.ciudad || "",
      categoria: p.categoria || "", observaciones: p.observaciones || "",
    });
    setErrores([]);
    setModalForm(true);
  };

  const handleGuardar = async () => {
    const errs = [];
    if (!form.nombre.trim()) errs.push("El nombre es requerido.");
    if (form.correo && !form.correo.includes("@")) errs.push("El correo no tiene un formato válido.");
    if (errs.length > 0) { setErrores(errs); return; }

    setProcesando(true);
    try {
      if (editandoId) {
        await proveedorService.actualizar(editandoId, form);
        if (toast) toast.exito(`"${form.nombre}" actualizado`);
      } else {
        await proveedorService.crear(form);
        if (toast) toast.exito(`"${form.nombre}" creado`);
      }
      setModalForm(false);
      cargar();
    } catch (err) {
      setErrores([err.message || "Error al guardar el proveedor."]);
    } finally {
      setProcesando(false);
    }
  };

  const handleToggleEstado = async (p) => {
    const nuevoEstado = p.estado === "activo" ? "inactivo" : "activo";
    try {
      await proveedorService.cambiarEstado(p.id, nuevoEstado);
      if (toast) toast.info(`"${p.nombre}" ahora está ${nuevoEstado}`);
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    setProcesando(true);
    try {
      await proveedorService.eliminar(modalEliminar.id);
      if (toast) toast.advertencia(`"${modalEliminar.nombre}" eliminado`);
      setModalEliminar(null);
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
      setModalEliminar(null);
    } finally {
      setProcesando(false);
    }
  };

  const activos    = proveedores.filter(p => p.estado === "activo").length;
  const inactivos  = proveedores.filter(p => p.estado === "inactivo").length;

  return (
    <div className="seccion-container">

      <div className="seccion-header">
        <h2 className="seccion-titulo">🏭 Proveedores</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip chip-verde">{activos} activos</span>
          <span className="chip chip-neutro">{inactivos} inactivos</span>
          <button className="btn-primario" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }} onClick={abrirCrear}>
            + Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="stock-controles" style={{ marginBottom: "1rem" }}>
        <div className="tab-selector">
          {["todos", "activo", "inactivo"].map(e => (
            <button key={e} className={`tab-btn ${filtroEstado === e ? "activo" : ""}`}
              onClick={() => setFiltroEstado(e)}>
              {e === "todos" ? "Todos" : e === "activo" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
        <input
          className="campo-input"
          style={{ maxWidth: "260px" }}
          placeholder="Buscar por nombre o NIT..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {cargando ? (
        <p className="texto-secundario">Cargando proveedores...</p>
      ) : proveedores.length === 0 ? (
        <div className="estado-vacio">
          <p className="texto-secundario">
            {busqueda ? `Sin resultados para "${busqueda}"` : "No hay proveedores registrados todavía."}
          </p>
        </div>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Categoría</th>
                <th>Contacto</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th className="th-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map(p => (
                <tr key={p.id}>
                  <td className="td-nombre">{p.nombre}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}>{p.nit || "—"}</td>
                  <td>{p.categoria ? <span className="chip chip-neutro">{p.categoria}</span> : "—"}</td>
                  <td style={{ fontSize: "0.82rem" }}>
                    {p.telefono && <div>{p.telefono}</div>}
                    {p.correo && <div className="texto-muted">{p.correo}</div>}
                    {!p.telefono && !p.correo && "—"}
                  </td>
                  <td>{p.ciudad || "—"}</td>
                  <td>
                    <span className={`chip ${p.estado === "activo" ? "chip-verde" : "chip-neutro"}`}>
                      {p.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="td-center">
                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                      <button className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => abrirEditar(p)}>
                        ✏️
                      </button>
                      <button className="btn-ghost" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => handleToggleEstado(p)}
                        title={p.estado === "activo" ? "Desactivar" : "Activar"}>
                        {p.estado === "activo" ? "⏸" : "▶"}
                      </button>
                      <button className="btn-eliminar" onClick={() => setModalEliminar(p)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR ───────────────────────────── */}
{modalForm && (
  <div
    className="modal-overlay"
    onClick={() => setModalForm(false)}
  >
    <div
      className="modal-box"
      style={{
        maxWidth: "520px",
        width: "100%",
        maxHeight: "calc(100vh - 80px)",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: "auto",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header modal-header-normal" style={{ flexShrink: 0 }}>
        <span className="modal-titulo">
          {editandoId ? "Editar proveedor" : "Nuevo proveedor"}
        </span>

        <button
          className="modal-cerrar"
          onClick={() => setModalForm(false)}
        >
          ✕
        </button>
      </div>

      <div
        className="modal-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto"
        }}
      >
        {errores.length > 0 && (
          <div
            className="alerta-error"
            style={{ marginBottom: "0.75rem" }}
          >
            {errores.map((e, i) => (
              <p key={i}>• {e}</p>
            ))}
          </div>
        )}

        <div className="campo-grupo">
          <label className="campo-label">Nombre *</label>
          <input
            className="campo-input"
            autoFocus
            placeholder="Ej: Distribuidora Sur"
            value={form.nombre}
            onChange={(e) =>
              setForm({ ...form, nombre: e.target.value })
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem"
          }}
        >
          <div className="campo-grupo">
            <label className="campo-label">NIT</label>
            <input
              className="campo-input"
              placeholder="Ej: 900123456-7"
              value={form.nit}
              onChange={(e) =>
                setForm({ ...form, nit: e.target.value })
              }
            />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Categoría</label>

            <input
              className="campo-input"
              list="categorias-proveedor"
              placeholder="Ej: Insumos"
              value={form.categoria}
              onChange={(e) =>
                setForm({ ...form, categoria: e.target.value })
              }
            />

            <datalist id="categorias-proveedor">
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem"
          }}
        >
          <div className="campo-grupo">
            <label className="campo-label">Teléfono</label>

            <input
              className="campo-input"
              placeholder="Ej: 3001234567"
              value={form.telefono}
              onChange={(e) =>
                setForm({ ...form, telefono: e.target.value })
              }
            />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Correo</label>

            <input
              className="campo-input"
              type="email"
              placeholder="proveedor@correo.com"
              value={form.correo}
              onChange={(e) =>
                setForm({ ...form, correo: e.target.value })
              }
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem"
          }}
        >
          <div className="campo-grupo">
            <label className="campo-label">Dirección</label>

            <input
              className="campo-input"
              placeholder="Calle 10 # 5-20"
              value={form.direccion}
              onChange={(e) =>
                setForm({ ...form, direccion: e.target.value })
              }
            />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">Ciudad</label>

            <input
              className="campo-input"
              placeholder="Ej: Medellín"
              value={form.ciudad}
              onChange={(e) =>
                setForm({ ...form, ciudad: e.target.value })
              }
            />
          </div>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Observaciones</label>

          <textarea
            className="queja-input"
            style={{ minHeight: "60px" }}
            placeholder="Notas adicionales sobre el proveedor..."
            value={form.observaciones}
            onChange={(e) =>
              setForm({
                ...form,
                observaciones: e.target.value
              })
            }
          />
        </div>
      </div>

      <div className="modal-footer" style={{ flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={() => setModalForm(false)}
        >
          Cancelar
        </button>

        <button
          className="btn-primario"
          onClick={handleGuardar}
          disabled={procesando}
        >
          {procesando
            ? "Guardando..."
            : editandoId
            ? "Guardar cambios"
            : "Crear proveedor"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── MODAL: ELIMINAR ─────────────────────────────────── */}
      <Modal
        abierto={!!modalEliminar}
        titulo="Eliminar proveedor"
        variante="peligro"
        labelConfirmar={procesando ? "Eliminando..." : "Eliminar"}
        labelCancelar="Cancelar"
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(null)}
      >
        {modalEliminar && (
          <p className="texto-secundario">
            ¿Eliminar <strong style={{ color: "var(--text-1)" }}>{modalEliminar.nombre}</strong>?
            {" "}Si tiene facturas registradas, no se podrá eliminar — desactívalo en su lugar.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Proveedores;