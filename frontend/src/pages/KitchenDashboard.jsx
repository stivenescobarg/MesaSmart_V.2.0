// frontend/src/pages/KitchenDashboard.jsx
// Tema claro · Azul cobalto #3250e6
// Lógica original intacta, pero con imágenes usando getImage

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate }                       from "react-router-dom";
import { useAuth }                           from "../context/AuthContext";
import { getImage }                          from "../utils/getImage"; // ← helper unificado
import { API_URL }                            from "../services/config";
import StockCocina                           from "../components/kitchen/StockCocina";
import KitchenSidebar                        from "../components/kitchen/KitchenSidebar";
import PedidosActivityPanel                  from "../components/kitchen/PedidosActivityPanel";
import "./KitchenDashboard.css";
import { authService } from "../services/authService";

// Ítems del sidebar según la vista activa (Fase 1: solo Pedidos/Preparación/Listo
// filtran lo que ya funciona; Historial y Alertas son placeholders — Fase 2)
const SIDEBAR_PEDIDOS = [
  { key: "todos",          label: "Pedidos",      icon: "📋" },
  { key: "en_preparacion", label: "Preparación",  icon: "🔥" },
  { key: "listo",          label: "Listo",        icon: "✅" },
  { key: "historial",      label: "Historial",    icon: "🗂️" },
];

const SIDEBAR_STOCK = [
  { key: "stock",     label: "Stock",     icon: "📦" },
  { key: "historial", label: "Historial", icon: "🗂️" },
  { key: "alertas",   label: "Alertas",   icon: "⚠️" },
];

// ── Constantes ────────────────────────────────────────────────────
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
  hour: "2-digit", minute: "2-digit",
});

const tiempoTranscurrido = hora => {
  const min = Math.floor((Date.now() - new Date(hora)) / 60000);
  if (min < 1)  return "Ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const esUrgente = hora =>
  Math.floor((Date.now() - new Date(hora)) / 60000) >= 15;

// ── Modal detalle ─────────────────────────────────────────────────
const PedidoModal = ({ pedido, onClose, onAvanzar }) => {
  if (!pedido) return null;
  const urgente = esUrgente(pedido.hora);

  return (
    <div className="kd-modal-overlay" onClick={onClose}>
      <div
        className={`kd-modal ${urgente ? "kd-modal-urgente" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="kd-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

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

        {pedido.notas && (
          <div className="kd-modal-nota">
            <span>📋</span>
            <span>{pedido.notas}</span>
          </div>
        )}

        <div className="kd-modal-items">
          {pedido.items?.map((item, i) => {
            // Usamos getImage con el nombre y la clave (si existe)
            const img = getImage(item.nombre, item.imagen || item.imgKey);
            return (
              <div key={i} className="kd-modal-item">
                <div className="kd-modal-item-img">
                  {img
                    ? <img src={img} alt={item.nombre} />
                    : <span className="kd-modal-item-placeholder">🍽️</span>
                  }
                </div>
                <div className="kd-modal-item-info">
                  <p className="kd-modal-item-name">{item.nombre}</p>
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
      {urgente && (
        <div className="kd-urgente-banner">
          ⚡ Urgente — {tiempoTranscurrido(pedido.hora)}
        </div>
      )}

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

      {pedido.notas && (
        <div className="kd-card-nota">📋 {pedido.notas}</div>
      )}

      <div className="kd-items">
        {pedido.items?.slice(0, 4).map((item, i) => {
          const img = getImage(item.nombre, item.imagen || item.imgKey);
          return (
            <div key={i} className="kd-item">
              <div className="kd-item-img">
                {img
                  ? <img src={img} alt={item.nombre} />
                  : <span className="kd-item-placeholder">🍽️</span>
                }
              </div>
              <span className="kd-item-qty">×{item.cantidad}</span>
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

 const [visiblePedidos, setVisiblePedidos] = useState(12);
const PEDIDOS_POR_PAGINA = 12;

  const [seccionPedidos, setSeccionPedidos] = useState("todos");   // sidebar de Pedidos
  const [seccionStock,   setSeccionStock]   = useState("stock");   // sidebar de Stock
  const [error,      setError]      = useState(false);
  const [actividad,  setActividad]  = useState([]);
  const prevPedidosRef = useRef([]);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos-cocina`, {
  headers: { Authorization: `Bearer ${authService.getToken()}` },
});
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        // Comparamos con la carga anterior para armar el feed de actividad
        const anteriores = prevPedidosRef.current;
        const eventos = [];
        data.forEach(p => {
          const previo = anteriores.find(a => a.id === p.id);
          if (!previo) {
            eventos.push({ id: `${p.id}-nuevo-${Date.now()}`, texto: `Pedido ${p.mesa} asignado a cocina`, hora: new Date() });
          } else if (previo.estado !== p.estado) {
            const texto = p.estado === "en_preparacion" ? `Pedido ${p.mesa} en preparación`
              : p.estado === "listo" ? `Pedido ${p.mesa} marcado como listo`
              : `Pedido ${p.mesa} actualizado`;
            eventos.push({ id: `${p.id}-${p.estado}-${Date.now()}`, texto, hora: new Date() });
          }
        });
        if (eventos.length > 0) {
          setActividad(prev => [...eventos, ...prev].slice(0, 8));
        }
        prevPedidosRef.current = data;
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

  useEffect(() => {
  setVisiblePedidos(PEDIDOS_POR_PAGINA);
}, [filtro]);

  const avanzarEstado = async (pedido) => {
    const nuevoEstado = ESTADO_NEXT[pedido.estado];
    if (!nuevoEstado) return;

    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)
    );

    try {
      await fetch(`${API_URL}/pedidos-cocina/${pedido.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
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

  const pendientes    = pedidos.filter(p => p.estado === "pendiente");
  const enPreparacion = pedidos.filter(p => p.estado === "en_preparacion");
  const listos        = pedidos.filter(p => p.estado === "listo");
  const urgentes      = pedidos.filter(p => esUrgente(p.hora) && p.estado !== "listo");

  const filtrados =
    filtro === "pendiente"      ? pendientes    :
    filtro === "en_preparacion" ? enPreparacion :
    filtro === "listo"          ? listos        :
    pedidos.filter(p => p.estado !== "listo");

   const filtradosVisibles = filtrados.slice(0, visiblePedidos); 

  const handleMetrica = tipo => setFiltro(prev => prev === tipo ? "todos" : tipo);

  // ── Métricas de rendimiento (sobre pedidos de hoy) ──
  const hoy = new Date().toDateString();
  const pedidosHoy      = pedidos.filter(p => new Date(p.hora).toDateString() === hoy);
  const listosHoy       = pedidosHoy.filter(p => p.estado === "listo");
  const minutosListos   = listosHoy.map(p => Math.floor((Date.now() - new Date(p.hora)) / 60000));
  const tiempoPromedio  = minutosListos.length
    ? `${Math.round(minutosListos.reduce((a, b) => a + b, 0) / minutosListos.length)} min`
    : "—";
  const eficiencia = pedidosHoy.length
    ? Math.round((pedidosHoy.filter(p => !esUrgente(p.hora) || p.estado === "listo").length / pedidosHoy.length) * 100)
    : 100;

return (
    <div className="kc-app">

      {/* ── TOPBAR ── */}
      <header className="kc-topbar">
        <div className="kc-topbar-marca">
          <div className="kc-topbar-icono">🍳</div>
          <div>
            <p className="kc-topbar-title">MesaSmart · Cocina</p>
            <p className="kc-topbar-subtitle">Panel en tiempo real</p>
          </div>
        </div>

        <div className="kc-topbar-tabs">
          <button
            className={`kc-topbar-tab ${!vistaStock ? "activo" : ""}`}
            onClick={() => setVistaStock(false)}
          >
            📋 Pedidos
          </button>
          <button
            className={`kc-topbar-tab ${vistaStock ? "activo" : ""}`}
            onClick={() => setVistaStock(true)}
          >
            📦 Stock
          </button>
        </div>

<div className="kc-topbar-user">
          <div className="kc-topbar-usuario">
            <div className="kc-topbar-usuario-avatar">CO</div>
            <p className="kc-topbar-usuario-nombre">Cocinero</p>
          </div>
          <button className="kd-salir" onClick={handleSalir}>Salir →</button>
        </div>
      </header>

      <div className="kc-body">
        <KitchenSidebar
          items={vistaStock ? SIDEBAR_STOCK : SIDEBAR_PEDIDOS}
          activo={vistaStock ? seccionStock : seccionPedidos}
          onSelect={vistaStock ? setSeccionStock : (key) => { setSeccionPedidos(key); setFiltro(key === "historial" ? "todos" : key); }}
        />

        <div className="kc-content" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
      {pedidoSel && (
        <PedidoModal
          pedido={pedidoSel}
          onClose={() => setPedidoSel(null)}
          onAvanzar={avanzarEstado}
        />
      )}


      {error && (
        <div className="kd-error-banner">
          ⚠️ Sin conexión al servidor — mostrando últimos datos
          <button onClick={cargar}>Reintentar</button>
        </div>
      )}

      {!vistaStock && urgentes.length > 0 && (
        <div className="kd-urgentes-banner">
          ⚡ {urgentes.length} pedido{urgentes.length > 1 ? "s" : ""}
          {" "}lleva{urgentes.length === 1 ? "" : "n"} más de 15 min esperando
        </div>
      )}

{/* ── PEDIDOS ── */}
      {!vistaStock && seccionPedidos !== "historial" && (
        <main className="kd-main">
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
              <p className="kd-metric-value">
                {pedidos.filter(p => p.estado !== "listo").length}
              </p>
            </div>
          </div>

          <div className="kd-filtros">
            {[
              { key: "todos",          label: "Todos activos" },
              { key: "pendiente",      label: "⏳ Pendiente"  },
              { key: "en_preparacion", label: "🔥 Preparando" },
              { key: "listo",          label: "✅ Listo"      },
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
  <>
    <div className="kd-grid">
      {filtradosVisibles.map((pedido) => (
        <PedidoCard
          key={pedido.id}
          pedido={pedido}
          onClick={setPedidoSel}
          onAvanzar={avanzarEstado}
        />
      ))}
    </div>

    {visiblePedidos < filtrados.length && (
      <div
        className="kc-cargar-mas-wrap"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "1rem",
        }}
      >
        <button
          className="kc-cargar-mas-btn"
          onClick={() =>
            setVisiblePedidos((v) => v + PEDIDOS_POR_PAGINA)
          }
        >
          Cargar más pedidos
        </button>

        <p className="kc-cargar-mas-info">
          Mostrando {filtradosVisibles.length} de {filtrados.length}
        </p>
      </div>
    )}
  </>
)}
        </main>
      )}

{/* ── STOCK ── */}
      {vistaStock && seccionStock === "stock" && (
        <main className="kd-main">
          <StockCocina />
        </main>
      )}

      {vistaStock && seccionStock === "historial" && (
        <div className="kc-proximamente">
          <span>🗂️</span>
          <h3>Historial de stock</h3>
          <p>Aquí verás todos los movimientos de inventario (ingresos y ajustes) con fecha y responsable. Lo construimos en la siguiente fase.</p>
        </div>
      )}

      {vistaStock && seccionStock === "alertas" && (
        <div className="kc-proximamente">
          <span>⚠️</span>
          <h3>Alertas críticas</h3>
          <p>Aquí verás todos los productos con stock bajo o agotado en un solo lugar. Lo construimos en la siguiente fase.</p>
        </div>
      )}

      {!vistaStock && seccionPedidos === "historial" && (
        <div className="kc-proximamente">
          <span>🗂️</span>
          <h3>Historial de pedidos</h3>
          <p>Aquí verás los pedidos ya entregados/pagados. Lo construimos en la siguiente fase.</p>
        </div>
      )}

          </div>

          {!vistaStock && seccionPedidos !== "historial" && (
            <PedidosActivityPanel
              actividad={actividad}
              tiempoPromedio={tiempoPromedio}
              completados={listosHoy.length}
              eficiencia={eficiencia}
            />
          )}

        </div>
      </div>
    </div>
  );
};
export default KitchenDashboard;