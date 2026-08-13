// frontend/src/pages/SuperAdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { superAdminService } from "../services/superAdminService";
import "./SuperAdminDashboard.css";

// ── Componente: tarjeta de un restaurante ────────────────────────
const RestauranteCard = ({ restaurante, onActivar, onSuspender, cargando }) => {
  const estadoConfig = {
    activo:    { label: "Activo",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    suspendido:{ label: "Suspendido",color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  };
  const cfg = estadoConfig[restaurante.estado] || estadoConfig.pendiente;

  return (
    <div className="sa-card">
      <div className="sa-card-header">
        <div>
          <h3 className="sa-card-nombre">{restaurante.nombre}</h3>
          <span className="sa-card-slug">/{restaurante.slug}</span>
        </div>
        <span className="sa-badge" style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.label}
        </span>
      </div>

      <div className="sa-card-meta">
        <span>👥 {restaurante.total_usuarios} usuario{restaurante.total_usuarios !== 1 ? "s" : ""}</span>
        <span>📅 {new Date(restaurante.creado_en).toLocaleDateString("es-CO")}</span>
        {restaurante.plan && <span>📋 {restaurante.plan}</span>}
      </div>

      <div className="sa-card-acciones">
        {restaurante.estado !== "activo" && (
          <button
            className="sa-btn sa-btn-activar"
            onClick={() => onActivar(restaurante.id)}
            disabled={cargando}
          >
            ✓ Activar
          </button>
        )}
        {restaurante.estado === "activo" && (
          <button
            className="sa-btn sa-btn-suspender"
            onClick={() => onSuspender(restaurante.id)}
            disabled={cargando}
          >
            ⏸ Suspender
          </button>
        )}
      </div>
    </div>
  );
};

// ── Componente: modal para crear restaurante ─────────────────────
const ModalCrear = ({ onCrear, onCerrar, cargando, error }) => {
  const [form, setForm] = useState({
    nombre: "", slug: "", plan: "",
    admin_nombre: "", admin_correo: "", admin_password: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-generar slug a partir del nombre
  const handleNombre = (v) => {
    set("nombre", v);
    set("slug", v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <div className="sa-overlay" onClick={onCerrar}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h2>Nuevo restaurante</h2>
          <button className="sa-modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="sa-modal-section-title">Datos del restaurante</div>
        <div className="sa-campo-grupo">
          <label>Nombre</label>
          <input placeholder="El Rincón Paisa" value={form.nombre} onChange={e => handleNombre(e.target.value)} />
        </div>
        <div className="sa-campo-grupo">
          <label>Slug (URL única)</label>
          <div className="sa-slug-preview">
            <span className="sa-slug-prefix">mesasmart.com/</span>
            <input
              value={form.slug}
              onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="el-rincon-paisa"
            />
          </div>
        </div>
        <div className="sa-campo-grupo">
          <label>Plan <span className="sa-opcional">(opcional)</span></label>
          <input placeholder="basico / pro" value={form.plan} onChange={e => set("plan", e.target.value)} />
        </div>

        <div className="sa-modal-section-title" style={{ marginTop: "1.5rem" }}>Admin del restaurante</div>
        <div className="sa-campo-grupo">
          <label>Nombre</label>
          <input placeholder="Juan Pérez" value={form.admin_nombre} onChange={e => set("admin_nombre", e.target.value)} />
        </div>
        <div className="sa-campo-grupo">
          <label>Correo</label>
          <input type="email" placeholder="admin@restaurante.com" value={form.admin_correo} onChange={e => set("admin_correo", e.target.value)} />
        </div>
        <div className="sa-campo-grupo">
          <label>Contraseña inicial</label>
          <input type="password" placeholder="••••••••" value={form.admin_password} onChange={e => set("admin_password", e.target.value)} />
        </div>

        {error && <div className="sa-error">{error}</div>}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button
            className="sa-btn sa-btn-crear"
            onClick={() => onCrear(form)}
            disabled={cargando || !form.nombre || !form.slug || !form.admin_nombre || !form.admin_correo || !form.admin_password}
          >
            {cargando ? "Creando..." : "Crear restaurante"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página principal ─────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const { usuario, logout } = useAuth();
  const [restaurantes, setRestaurantes]   = useState([]);
  const [cargando,     setCargando]       = useState(true);
  const [accion,       setAccion]         = useState(null); // id siendo procesado
  const [modalCrear,   setModalCrear]     = useState(false);
  const [errorModal,   setErrorModal]     = useState("");
  const [creando,      setCreando]        = useState(false);
  const [toast,        setToast]          = useState(null); // { msg, tipo }

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await superAdminService.listarRestaurantes();
      setRestaurantes(data.restaurantes);
    } catch {
      mostrarToast("Error al cargar restaurantes.", "error");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleActivar = async (id) => {
    setAccion(id);
    try {
      await superAdminService.activar(id);
      mostrarToast("Restaurante activado correctamente.");
      cargar();
    } catch (err) {
      mostrarToast(err.message, "error");
    } finally {
      setAccion(null);
    }
  };

  const handleSuspender = async (id) => {
    if (!confirm("¿Confirmas la suspensión? Las sesiones activas expirarán en máx. 8h.")) return;
    setAccion(id);
    try {
      await superAdminService.suspender(id);
      mostrarToast("Restaurante suspendido.");
      cargar();
    } catch (err) {
      mostrarToast(err.message, "error");
    } finally {
      setAccion(null);
    }
  };

  const handleCrear = async (form) => {
    setCreando(true);
    setErrorModal("");
    try {
      await superAdminService.crearRestaurante(form);
      setModalCrear(false);
      mostrarToast("Restaurante creado en estado pendiente.");
      cargar();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setCreando(false);
    }
  };

  // Contadores para el resumen
  const total     = restaurantes.length;
  const activos   = restaurantes.filter(r => r.estado === "activo").length;
  const pendientes = restaurantes.filter(r => r.estado === "pendiente").length;

  return (
    <div className="sa-root">

      {/* Header */}
      <header className="sa-header">
        <div className="sa-header-left">
          <span className="sa-logo">◆</span>
          <div>
            <h1 className="sa-titulo">MesaSmart</h1>
            <p className="sa-subtitulo">Panel de administración de plataforma</p>
          </div>
        </div>
        <div className="sa-header-right">
          <span className="sa-usuario">{usuario?.nombre}</span>
          <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="sa-main">

        {/* Resumen */}
        <div className="sa-resumen">
          <div className="sa-stat">
            <span className="sa-stat-valor">{total}</span>
            <span className="sa-stat-label">Total restaurantes</span>
          </div>
          <div className="sa-stat">
            <span className="sa-stat-valor" style={{ color: "#10b981" }}>{activos}</span>
            <span className="sa-stat-label">Activos</span>
          </div>
          <div className="sa-stat">
            <span className="sa-stat-valor" style={{ color: "#f59e0b" }}>{pendientes}</span>
            <span className="sa-stat-label">Pendientes</span>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="sa-toolbar">
          <h2 className="sa-seccion-titulo">Restaurantes</h2>
          <button className="sa-btn sa-btn-crear" onClick={() => setModalCrear(true)}>
            + Nuevo restaurante
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="sa-cargando">Cargando...</div>
        ) : restaurantes.length === 0 ? (
          <div className="sa-vacio">No hay restaurantes registrados. Crea el primero.</div>
        ) : (
          <div className="sa-grid">
            {restaurantes.map(r => (
              <RestauranteCard
                key={r.id}
                restaurante={r}
                onActivar={handleActivar}
                onSuspender={handleSuspender}
                cargando={accion === r.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal crear */}
      {modalCrear && (
        <ModalCrear
          onCrear={handleCrear}
          onCerrar={() => { setModalCrear(false); setErrorModal(""); }}
          cargando={creando}
          error={errorModal}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`sa-toast ${toast.tipo === "error" ? "sa-toast-error" : "sa-toast-ok"}`}>
          {toast.tipo === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;