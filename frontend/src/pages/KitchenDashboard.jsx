// frontend/src/pages/KitchenDashboard.jsx
// Rediseño visual v2 — Azul cobalto #3250e6
// Lógica original intacta · Mejoras visuales: imágenes grandes,
// descripción de producto, jerarquía mejorada, tipografía Syne + IBM Plex

import { useState, useEffect, useCallback } from "react";
import { useNavigate }                       from "react-router-dom";
import { useAuth }                           from "../context/AuthContext";
import { imagenes }                          from "../data/imagenes";
import StockCocina                           from "../components/kitchen/StockCocina";
import "./KitchenDashboard.css";

// ── Constantes de estado ─────────────────────────────────────────
const ESTADO_LABEL = {
  pendiente:      "Pendiente",
  en_preparacion: "En prep.",
  listo:          "Listo",
};

const ESTADO_NEXT = {
  pendiente:      "en_preparacion",
  en_preparacion: "listo",
};

const ESTADO_BTN = {
  pendiente:      "▶ Iniciar preparación",
  en_preparacion: "✓ Marcar como listo",
};

// ── Helpers ───────────────────────────────────────────────────────
const fmtHora = iso => new Date(iso).toLocaleTimeString("es-CO", {
  hour: "2-digit", minute: "2-digit"
});

const tiempoTranscurrido = hora => {
  const min = Math.floor((Date.now() - new Date(hora)) / 60000);
  if (min < 1)  return "Ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const esUrgente = hora => {
  const min = Math.floor((Date.now() - new Date(hora)) / 60000);
  return min >= 15;
};

// ── Modal detalle de pedido ───────────────────────────────────────
const PedidoModal = ({ pedido, onClose, onAvanzar }) => {
  if (!pedido) return null;
  const urgente = esUrgente(pedido.hora);

  return (
    <div className="kd-modal-overlay" onClick={onClose}>
      <div
        className={`kd-modal ${urgente ? "kd-modal-urgente" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="kd-modal-handle" />
        <button className="kd-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        {/* Header */}
        <div className="kd-modal-header">
          <div>
            <h2 className="kd-modal-title">{pedido.mesa}</h2>
            <p className="kd-modal-time">
              🕐 {fmtHora(pedido.hora)}
              <span className={`kd-tiempo-badge ${urgente ? "urgente" : ""}`}>
                {tiempoTranscurrido(pedido.hora)}
              </span>
            </p>
          </div>
          <span className={`kd-badge estado-${pedido.estado}`}>
            {ESTADO_LABEL[pedido.estado]}
          </span>
        </div>

        {/* Nota del pedido */}
        {pedido.notas && (
          <div className="kd-modal-nota">
            <span>📋</span>
            <span>{pedido.notas}</span>
          </div>
        )}

        {/* Items */}
        <div className="kd-modal-items">
          {pedido.items?.map((item, i) => {
            const img = imagenes[item.imagen] || imagenes[item.imgKey] || null;
            return (
              <div key={i} className="kd-modal-item">
                {/* Imagen grande del producto */}
                <div className="kd-modal-item-img">
                  {img
                    ? <img src={img} alt={item.nombre} />
                    : <span className="kd-modal-item-placeholder">🍽️</span>
                  }
                </div>

                <div className="kd-modal-item-info">
                  <p className="kd-modal-item-name">{item.nombre}</p>

                  {/* Descripción del producto */}
                  {item.descripcion && (
                    <p className="kd-modal-item-desc">{item.descripcion}</p>
                  )}

                  <div className="kd-modal-item-meta">
                    <span className="kd-qty-badge">×{item.cantidad}</span>
                    {item.observacion && (
                      <span className="kd-modal-item-obs">📌 {item.observacion}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón de acción */}
        {ESTADO_BTN[pedido.estado] && (
          <button
            className={`kd-modal-btn-avanzar estado-${pedido.estado}`}
            onClick={() => { onAvanzar(pedido); onClose(); }}
          >
            {ESTADO_BTN[pedido.estado]}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Tarjeta de pedido ─────────────────────────────────────────────
const PedidoCard = ({ pedido, onClick, onAvanzar }) => {
  const urgente = esUrgente(pedido.hora);

  return (
    <div
      className={`kd-card estado-${pedido.estado} ${urgente ? "kd-card-urgente" : ""}`}
      onClick={() => onClick(pedido)}
    >
      {/* Banner urgente */}
      {urgente && (
        <div className="kd-urgente-banner">
          ⚡ Urgente — {tiempoTranscurrido(pedido.hora)}
        </div>
      )}

      {/* Header: mesa, tiempo y badge */}
      <div className="kd-card-header">
        <div className="kd-card-mesa">
          <span className={`kd-num estado-${pedido.estado}`}>
            {pedido.mesa?.replace(/\D/g, "") || "?"}
          </span>
          <div>
            <p className="kd-card-mesa-nombre">{pedido.mesa}</p>
            <p className="kd-card-tiempo">
              {fmtHora(pedido.hora)} · {tiempoTranscurrido(pedido.hora)}
            </p>
          </div>
        </div>
        <span className={`kd-badge estado-${pedido.estado}`}>
          {ESTADO_LABEL[pedido.estado]}
        </span>
      </div>

      {/* Nota del pedido */}
      {pedido.notas && (
        <div className="kd-card-nota">📋 {pedido.notas}</div>
      )}

      {/* Items con imagen, nombre, descripción, cantidad y observaciones */}
      <div className="kd-items">
        {pedido.items?.slice(0, 4).map((item, i) => {
          const img = imagenes[item.imagen] || imagenes[item.imgKey] || null;
          return (
            <div key={i} className="kd-item">
              {/* Imagen del producto */}
              <div className="kd-item-img">
                {img
                  ? <img src={img} alt={item.nombre} />
                  : <span className="kd-item-placeholder">🍽️</span>
                }
              </div>

              {/* Cantidad */}
              <span className="kd-item-qty">×{item.cantidad}</span>

              {/* Info: nombre + descripción + observación */}
              <div className="kd-item-info">
                <p className="kd-item-nombre">{item.nombre}</p>
                {item.descripcion && (
                  <p className="kd-item-desc">{item.descripcion}</p>
                )}
                {item.observacion && (
                  <p className="kd-item-nota">📌 {item.observacion}</p>
                )}
              </div>
            </div>
          );
        })}

        {(pedido.items?.length || 0) > 4 && (
          <p className="kd-items-mas">
            +{pedido.items.length - 4} más — toca para ver todo
          </p>
        )}
      </div>

      {/* Botón avanzar estado */}
      {ESTADO_BTN[pedido.estado] && (
        <button
          className={`kd-btn-avanzar estado-${pedido.estado}`}
          onClick={e => { e.stopPropagation(); onAvanzar(pedido); }}
        >
          {ESTADO_BTN[pedido.estado]}
        </button>
      )}
    </div>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
const KitchenDashboard = () => {
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [pedidos,    setPedidos]    = useState([]);
  const [filtro,     setFiltro]     = useState("todos");
  const [cargando,   setCargando]   = useState(true);
  const [pedidoSel,  setPedidoSel]  = useState(null);
  const [vistaStock, setVistaStock] = useState(false);
  const [error,      setError]      = useState(false);

  // ── Cargar pedidos ───────────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/pedidos-cocina");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        setPedidos(data);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 8000);
    return () => clearInterval(id);
  }, [cargar]);

  // ── Avanzar estado ───────────────────────────────────────────
  const avanzarEstado = async (pedido) => {
    const nuevoEstado = ESTADO_NEXT[pedido.estado];
    if (!nuevoEstado) return;

    // Optimistic update
    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)
    );

    try {
      await fetch(`http://localhost:3001/api/pedidos-cocina/${pedido.id}/estado`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
      // Revertir si falla
      setPedidos(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, estado: pedido.estado } : p)
      );
    }
  };

  const handleSalir = async () => {
    localStorage.removeItem("ms_token");
    await logout();
    navigate("/login", { replace: true });
  };

  // ── Métricas ─────────────────────────────────────────────────
  const pendientes    = pedidos.filter(p => p.estado === "pendiente");
  const enPreparacion = pedidos.filter(p => p.estado === "en_preparacion");
  const listos        = pedidos.filter(p => p.estado === "listo");
  const urgentes      = pedidos.filter(p => esUrgente(p.hora) && p.estado !== "listo");

  const filtrados =
    filtro === "pendiente"      ? pendientes    :
    filtro === "en_preparacion" ? enPreparacion :
    filtro === "listo"          ? listos        :
    pedidos.filter(p => p.estado !== "listo");

  const handleMetrica = tipo => setFiltro(prev => prev === tipo ? "todos" : tipo);

  return (
    <div className="kd-root" data-kitchen-theme="dark">

      {/* ── Modal de detalle ── */}
      {pedidoSel && (
        <PedidoModal
          pedido={pedidoSel}
          onClose={() => setPedidoSel(null)}
          onAvanzar={avanzarEstado}
        />
      )}

      {/* ══ HEADER ══ */}
      <header className="kd-header">
        <div className="kd-header-marca">
          <div className="kd-header-icono">🍳</div>
          <div>
            <h1 className="kd-title">MesaSmart · Cocina</h1>
            <p className="kd-subtitle">Panel en tiempo real</p>
          </div>
        </div>

        {/* Tabs de vista */}
        <div className="kd-view-tabs">
          <button
            className={`kd-view-tab ${!vistaStock ? "activo" : ""}`}
            onClick={() => setVistaStock(false)}
          >
            📋 Pedidos
          </button>
          <button
            className={`kd-view-tab ${vistaStock ? "activo" : ""}`}
            onClick={() => setVistaStock(true)}
          >
            📦 Stock
          </button>
        </div>

        <button className="kd-salir" onClick={handleSalir}>Salir →</button>
      </header>

      {/* ── Banner de error ── */}
      {error && (
        <div className="kd-error-banner">
          ⚠️ Sin conexión al servidor — mostrando últimos datos
          <button onClick={cargar}>Reintentar</button>
        </div>
      )}

      {/* ── Banner urgentes ── */}
      {!vistaStock && urgentes.length > 0 && (
        <div className="kd-urgentes-banner">
          ⚡ {urgentes.length} pedido{urgentes.length > 1 ? "s" : ""}{" "}
          lleva{urgentes.length === 1 ? "" : "n"} más de 15 min esperando
        </div>
      )}

      {/* ══ VISTA PEDIDOS ══ */}
      {!vistaStock && (
        <main className="kd-main">

          {/* Métricas */}
          <div className="kd-metrics">
            <div
              className={`kd-metric ${filtro === "pendiente" ? "metric-active" : ""}`}
              onClick={() => handleMetrica("pendiente")}
            >
              <p className="kd-metric-label">Pendientes</p>
              <p className="kd-metric-value orange">{pendientes.length}</p>
            </div>
            <div
              className={`kd-metric ${filtro === "en_preparacion" ? "metric-active" : ""}`}
              onClick={() => handleMetrica("en_preparacion")}
            >
              <p className="kd-metric-label">En preparación</p>
              <p className="kd-metric-value blue">{enPreparacion.length}</p>
            </div>
            <div
              className={`kd-metric ${filtro === "listo" ? "metric-active" : ""}`}
              onClick={() => handleMetrica("listo")}
            >
              <p className="kd-metric-label">Listos</p>
              <p className="kd-metric-value green">{listos.length}</p>
            </div>
            <div
              className={`kd-metric ${urgentes.length > 0 ? "metric-urgente" : ""} ${filtro === "todos" ? "metric-active" : ""}`}
              onClick={() => handleMetrica("todos")}
            >
              <p className="kd-metric-label">Activos</p>
              <p className="kd-metric-value">{pedidos.filter(p => p.estado !== "listo").length}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="kd-filtros">
            {[
              { key: "todos",          label: "Todos activos"  },
              { key: "pendiente",      label: "⏳ Pendiente"   },
              { key: "en_preparacion", label: "🔥 Preparando"  },
              { key: "listo",          label: "✅ Listo"       },
            ].map(f => (
              <button
                key={f.key}
                className={`kd-filtro-btn ${filtro === f.key ? "active" : ""}`}
                onClick={() => setFiltro(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grid de pedidos */}
          {cargando ? (
            <div className="kd-empty">
              <div className="kd-spinner" />
              <p>Cargando pedidos...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="kd-empty">
              <span>👨‍🍳</span>
              <p>Sin pedidos en este estado</p>
            </div>
          ) : (
            <div className="kd-grid">
              {filtrados.map(pedido => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onClick={setPedidoSel}
                  onAvanzar={avanzarEstado}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* ══ VISTA STOCK ══ */}
      {vistaStock && (
        <main className="kd-main">
          <StockCocina />
        </main>
      )}
    </div>
  );
};

export default KitchenDashboard;