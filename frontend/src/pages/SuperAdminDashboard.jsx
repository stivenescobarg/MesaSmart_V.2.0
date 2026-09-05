// frontend/src/pages/SuperAdminDashboard.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { superAdminService } from "../services/superAdminService";
import ModalDetalleRestaurante from "./ModalDetalleRestaurante";
import "./SuperAdminDashboard.css";

const POR_PAGINA = 6;

const PLAN_CFG = {
  basico:   { label: "Básico",   color: "#8791a2", bg: "rgba(255,255,255,0.05)" },
  completo: { label: "Completo", color: "#f0a52c", bg: "rgba(240,165,44,0.12)" },
};

// ── Componente: tarjeta de un restaurante ────────────────────────
const RestauranteCard = ({ restaurante, onActivar, onSuspender, onVerDetalle, cargando }) => {
  const estadoConfig = {
    activo:    { label: "Activo",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    pendiente: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    suspendido:{ label: "Suspendido",color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  };

  const cfg = estadoConfig[restaurante.estado] || estadoConfig.pendiente;
  const planCfg = PLAN_CFG[restaurante.plan] || PLAN_CFG.basico;

  return (
    <div className="sa-card">
      <div className="sa-card-header">
        <div>
          <h3 className="sa-card-nombre">{restaurante.nombre}</h3>
          <span className="sa-card-slug">/{restaurante.slug}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
          <span className="sa-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>

          <span className="sa-badge" style={{ color: planCfg.color, background: planCfg.bg }}>
            {planCfg.label}
          </span>
        </div>
      </div>

      <div className="sa-card-meta">
        <span>👥 {restaurante.total_usuarios} usuario{restaurante.total_usuarios !== 1 ? "s" : ""}</span>
        <span>📅 {new Date(restaurante.creado_en).toLocaleDateString("es-CO")}</span>
      </div>

      <div className="sa-card-acciones">
        <button className="sa-btn sa-btn-ghost" onClick={() => onVerDetalle(restaurante.id)}>
          🔍 Ver detalle
        </button>

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
    nombre: "",
    slug: "",
    plan: "basico",
    admin_nombre: "",
    admin_correo: "",
    admin_correo_personal: "",
    admin_telefono: "",
    admin_password: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNombre = (v) => {
    set("nombre", v);
    set(
      "slug",
      v
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  };

  return (
    <div className="sa-overlay" onClick={onCerrar}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h2>Nuevo restaurante</h2>
          <button className="sa-modal-cerrar" onClick={onCerrar}>
            ✕
          </button>
        </div>

        <div className="sa-modal-section-title">Datos del restaurante</div>

        <div className="sa-campo-grupo">
          <label>Nombre</label>
          <input
            placeholder="El Rincón Paisa"
            value={form.nombre}
            onChange={e => handleNombre(e.target.value)}
          />
        </div>

        <div className="sa-campo-grupo">
          <label>Slug (URL única)</label>
          <div className="sa-slug-preview">
            <span className="sa-slug-prefix">mesasmart.com/</span>
            <input
              value={form.slug}
              onChange={e =>
                set(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
              }
              placeholder="el-rincon-paisa"
            />
          </div>
        </div>

        <div className="sa-campo-grupo">
          <label>Plan</label>
          <select
            value={form.plan}
            onChange={e => set("plan", e.target.value)}
          >
            <option value="basico">Básico</option>
            <option value="completo">Completo</option>
          </select>
        </div>

        <div
          className="sa-modal-section-title"
          style={{ marginTop: "1.5rem" }}
        >
          Admin del restaurante
        </div>

        <div className="sa-campo-grupo">
          <label>Nombre</label>
          <input
            placeholder="Juan Pérez"
            value={form.admin_nombre}
            onChange={e => set("admin_nombre", e.target.value)}
          />
        </div>

        <div className="sa-campo-grupo">
          <label>Correo</label>
          <input
            type="email"
            placeholder="admin@restaurante.com"
            value={form.admin_correo}
            onChange={e => set("admin_correo", e.target.value)}
          />
        </div>

        <div className="sa-campo-grupo">
          <label>Correo personal</label>
          <input
            type="email"
            placeholder="correo.personal@gmail.com"
            value={form.admin_correo_personal}
            onChange={e => set("admin_correo_personal", e.target.value)}
          />
        </div>

        <div className="sa-campo-grupo">
          <label>Teléfono</label>
          <input
            type="tel"
            placeholder="3001234567"
            value={form.admin_telefono}
            onChange={e => set("admin_telefono", e.target.value)}
          />
        </div>

        <div className="sa-campo-grupo">
          <label>Contraseña inicial</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.admin_password}
            onChange={e => set("admin_password", e.target.value)}
          />
        </div>

        {error && <div className="sa-error">{error}</div>}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onCerrar}>
            Cancelar
          </button>

          <button
            className="sa-btn sa-btn-crear"
            onClick={() => onCrear(form)}
            disabled={
              cargando ||
              !form.nombre ||
              !form.slug ||
              !form.admin_nombre ||
              !form.admin_correo ||
              !form.admin_correo_personal ||
              !form.admin_telefono ||
              !form.admin_password
            }
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
  const [restaurantes, setRestaurantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [creando, setCreando] = useState(false);
  const [toast, setToast] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  // ── Búsqueda, filtros y paginación ──
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPlan, setFiltroPlan] = useState("todos");
  const [pagina, setPagina] = useState(1);

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

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Resetea a la página 1 cada vez que cambia algún filtro, para no
  // quedar "atrapado" en una página vacía tras filtrar.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado, filtroPlan]);

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
    if (!confirm("¿Confirmas la suspensión? Las sesiones activas expirarán en máx. 8h."))
      return;

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

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true);

    try {
      await superAdminService.descargarExcel();
    } catch (err) {
      mostrarToast(err.message, "error");
    } finally {
      setDescargandoExcel(false);
    }
  };

  // ── Filtrado ──
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return restaurantes.filter(r => {
      if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
      if (filtroPlan !== "todos" && r.plan !== filtroPlan) return false;

      if (
        q &&
        !r.nombre.toLowerCase().includes(q) &&
        !r.slug.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [restaurantes, busqueda, filtroEstado, filtroPlan]);

  // ── Paginación ──
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsPagina = filtrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  // Contadores del resumen: sobre el total real, no sobre lo filtrado —
  // así siempre reflejan la cuenta global de la plataforma.
  const total = restaurantes.length;
  const activos = restaurantes.filter(r => r.estado === "activo").length;
  const pendientes = restaurantes.filter(r => r.estado === "pendiente").length;

  return (
    <div className="sa-root">

      <header className="sa-header">
        <div className="sa-header-left">
          <span className="sa-logo">◆</span>

          <div>
            <h1 className="sa-titulo">MesaSmart</h1>
            <p className="sa-subtitulo">
              Panel de administración de plataforma
            </p>
          </div>
        </div>

        <div className="sa-header-right">
          <span className="sa-usuario">{usuario?.nombre}</span>

          <button
            className="sa-btn sa-btn-ghost sa-btn-sm"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="sa-main">

        <div className="sa-resumen">
          <div className="sa-stat">
            <span className="sa-stat-valor">{total}</span>
            <span className="sa-stat-label">Total restaurantes</span>
          </div>

          <div className="sa-stat">
            <span
              className="sa-stat-valor"
              style={{ color: "#10b981" }}
            >
              {activos}
            </span>
            <span className="sa-stat-label">Activos</span>
          </div>

          <div className="sa-stat">
            <span
              className="sa-stat-valor"
              style={{ color: "#f59e0b" }}
            >
              {pendientes}
            </span>
            <span className="sa-stat-label">Pendientes</span>
          </div>
        </div>

        <div className="sa-toolbar">
          <h2 className="sa-seccion-titulo">Restaurantes</h2>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              className="sa-btn sa-btn-ghost"
              onClick={handleDescargarExcel}
              disabled={descargandoExcel}
            >
              {descargandoExcel ? "Generando..." : "📥 Descargar Excel"}
            </button>

            <button
              className="sa-btn sa-btn-crear"
              onClick={() => setModalCrear(true)}
            >
              + Nuevo restaurante
            </button>
          </div>
        </div>

        {/* ── Filtros ─────────────────────────────────────────── */}
        <div className="sa-filtros">
          <input
            className="sa-filtro-buscar"
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <select
            className="sa-filtro-select"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente</option>
            <option value="suspendido">Suspendido</option>
          </select>

          <select
            className="sa-filtro-select"
            value={filtroPlan}
            onChange={e => setFiltroPlan(e.target.value)}
          >
            <option value="todos">Todos los planes</option>
            <option value="basico">Básico</option>
            <option value="completo">Completo</option>
          </select>
        </div>

        {cargando ? (
          <div className="sa-cargando">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="sa-vacio">
            {restaurantes.length === 0
              ? "No hay restaurantes registrados. Crea el primero."
              : "Ningún restaurante coincide con estos filtros."}
          </div>
        ) : (
          <>
            <div className="sa-grid">
              {itemsPagina.map(r => (
                <RestauranteCard
                  key={r.id}
                  restaurante={r}
                  onActivar={handleActivar}
                  onSuspender={handleSuspender}
                  onVerDetalle={setDetalleId}
                  cargando={accion === r.id}
                />
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="sa-paginador">
                <button
                  className="sa-btn sa-btn-ghost sa-btn-sm"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaSegura === 1}
                >
                  ← Anterior
                </button>

                <span className="sa-paginador-info">
                  Página {paginaSegura} de {totalPaginas}
                </span>

                <button
                  className="sa-btn sa-btn-ghost sa-btn-sm"
                  onClick={() =>
                    setPagina(p => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaSegura === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {modalCrear && (
        <ModalCrear
          onCrear={handleCrear}
          onCerrar={() => {
            setModalCrear(false);
            setErrorModal("");
          }}
          cargando={creando}
          error={errorModal}
        />
      )}

      {detalleId && (
        <ModalDetalleRestaurante
          restauranteId={detalleId}
          onCerrar={() => setDetalleId(null)}
        />
      )}

      {toast && (
        <div
          className={`sa-toast ${
            toast.tipo === "error"
              ? "sa-toast-error"
              : "sa-toast-ok"
          }`}
        >
          {toast.tipo === "ok" ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;