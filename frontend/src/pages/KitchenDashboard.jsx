// frontend/src/pages/KitchenDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth }             from "../context/AuthContext";
import { imagenes }            from "../data/imagenes";
import "./Kitchen.css";

const ESTADO_LABEL = {
  pendiente:      "Pendiente",
  en_preparacion: "En preparación",
  listo:          "Listo",
};

const ESTADO_NEXT = {
  pendiente:      "en_preparacion",
  en_preparacion: "listo",
};

const ESTADO_BTN = {
  pendiente:      "Iniciar preparación",
  en_preparacion: "Marcar listo",
};

const fmtCOP  = n => `$${Number(n).toLocaleString("es-CO")}`;
const fmtHora = iso => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const tiempoTranscurrido = hora => {
  const min = Math.floor((Date.now() - new Date(hora)) / 60000);
  if (min < 1)  return "ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

// ── Modal detalle de pedido ──────────────────────────────────
const PedidoModal = ({ pedido, onClose, onAvanzar }) => {
  if (!pedido) return null;
  return (
    <div className="kd-modal-overlay" onClick={onClose}>
      <div className="kd-modal" onClick={e => e.stopPropagation()}>
        <div className="kd-modal-handle" />
        <button className="kd-modal-close" onClick={onClose}>✕</button>

        <div className="kd-modal-header">
          <h2 className="kd-modal-title">{pedido.mesa}</h2>
          <span className={`kd-badge estado-${pedido.estado}`}>
            {ESTADO_LABEL[pedido.estado]}
          </span>
        </div>

        <p className="kd-modal-time">🕐 {fmtHora(pedido.hora)} · {tiempoTranscurrido(pedido.hora)}</p>

        {pedido.notas && (
          <p className="kd-modal-nota">📋 {pedido.notas}</p>
        )}

        <div className="kd-modal-items">
          {pedido.items?.map((item, i) => {
            const imagen = imagenes[item.imagen] || imagenes[item.imgKey] || null;
            return (
              <div key={i} className="kd-modal-item">
                <div className="kd-modal-item-img">
                  {imagen
                    ? <img src={imagen} alt={item.nombre} />
                    : <span className="kd-modal-item-placeholder">🍽️</span>
                  }
                </div>
                <div className="kd-modal-item-info">
                  <p className="kd-modal-item-name">{item.nombre}</p>
                  <p className="kd-modal-item-qty">Cantidad: {item.cantidad}</p>
                  {item.precio > 0 && (
                    <p className="kd-modal-item-precio">{fmtCOP(item.precio)}</p>
                  )}
                  {item.observacion && (
                    <p className="kd-modal-item-obs">📌 {item.observacion}</p>
                  )}
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
            ✅ {ESTADO_BTN[pedido.estado]}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Dashboard principal ──────────────────────────────────────
const KitchenDashboard = () => {
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [pedidos,   setPedidos]   = useState([]);
  const [filtro,    setFiltro]    = useState("todos");
  const [cargando,  setCargando]  = useState(true);
  const [pedidoSel, setPedidoSel] = useState(null);

  // ── Cargar pedidos desde backend ──────────────────────────
  const cargar = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/pedidos-cocina");
      const data = await res.json();
      if (Array.isArray(data)) setPedidos(data);
    } catch {
      // fallback mock cuando el backend no responde
      setPedidos([
        {
          id: 1, mesa: "Mesa 3", estado: "pendiente",
          hora: new Date().toISOString(), notas: "Sin cebolla",
          items: [
            { nombre: "Hamburguesa Especial", cantidad: 2, precio: 28000, imagen: "hamburguesa", observacion: "Sin cebolla" },
            { nombre: "Alitas BBQ",           cantidad: 1, precio: 32000, imagen: "alitas",       observacion: "" },
          ],
        },
        {
          id: 2, mesa: "Mesa 7", estado: "en_preparacion",
          hora: new Date(Date.now() - 8 * 60000).toISOString(), notas: "",
          items: [
            { nombre: "Bandeja Paisa",     cantidad: 1, precio: 36000, imagen: "bandeja",   observacion: "" },
            { nombre: "Carbonara Clásica", cantidad: 2, precio: 30000, imagen: "carbonara", observacion: "Extra queso" },
          ],
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 8000);
    return () => clearInterval(id);
  }, []);

  // ── Avanzar estado ────────────────────────────────────────
  const avanzarEstado = async (pedido) => {
    const nuevoEstado = ESTADO_NEXT[pedido.estado];
    if (!nuevoEstado) return;
    try {
      await fetch(`http://localhost:3001/api/pedidos-cocina/${pedido.id}/estado`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {}
    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)
    );
  };

  const handleSalir = async () => { await logout(); navigate("/login", { replace: true }); };

  // ── Métricas ──────────────────────────────────────────────
  const pendientes    = pedidos.filter(p => p.estado === "pendiente");
  const enPreparacion = pedidos.filter(p => p.estado === "en_preparacion");
  const listos        = pedidos.filter(p => p.estado === "listo");
  const activos       = pedidos.filter(p => p.estado !== "listo");

  // ── Filtrado según métrica o botón ────────────────────────
  const filtrados =
    filtro === "pendiente"      ? pendientes    :
    filtro === "en_preparacion" ? enPreparacion :
    filtro === "listo"          ? listos        :
    pedidos.filter(p => p.estado !== "listo");   // "todos" = activos

  const tituloSeccion =
    filtro === "pendiente"      ? "Pendientes"      :
    filtro === "en_preparacion" ? "En preparación"  :
    filtro === "listo"          ? "Listos hoy"       :
    "Órdenes activas";

  // Alterna el filtro al hacer clic en métrica
  const handleMetrica = (tipo) => {
    setFiltro(prev => prev === tipo ? "todos" : tipo);
  };

  return (
    <div className="kd-container">

      {pedidoSel && (
        <PedidoModal
          pedido={pedidoSel}
          onClose={() => setPedidoSel(null)}
          onAvanzar={avanzarEstado}
        />
      )}

      {/* HEADER */}
      <div className="kd-header">
        <div>
          <h1 className="kd-title">Panel de Cocina</h1>
          <p className="kd-subtitle">Panel de cocina — turno activo</p>
        </div>
        <button className="kd-salir" onClick={handleSalir}>Salir</button>
      </div>

      {/* MÉTRICAS — clic filtra la lista */}
      <div className="kd-metrics">
        <div
          className={`kd-metric ${filtro === "pendiente" ? "metric-active" : ""}`}
          onClick={() => handleMetrica("pendiente")}
          style={{ cursor: "pointer" }}
        >
          <p className="kd-metric-label">Pendientes</p>
          <p className="kd-metric-value orange">{pendientes.length}</p>
        </div>
        <div
          className={`kd-metric ${filtro === "en_preparacion" ? "metric-active" : ""}`}
          onClick={() => handleMetrica("en_preparacion")}
          style={{ cursor: "pointer" }}
        >
          <p className="kd-metric-label">En preparación</p>
          <p className="kd-metric-value blue">{enPreparacion.length}</p>
        </div>
        <div
          className={`kd-metric ${filtro === "listo" ? "metric-active" : ""}`}
          onClick={() => handleMetrica("listo")}
          style={{ cursor: "pointer" }}
        >
          <p className="kd-metric-label">Listos hoy</p>
          <p className="kd-metric-value green">{listos.length}</p>
        </div>
        <div
          className={`kd-metric ${filtro === "todos" ? "metric-active" : ""}`}
          onClick={() => handleMetrica("todos")}
          style={{ cursor: "pointer" }}
        >
          <p className="kd-metric-label">Total activos</p>
          <p className="kd-metric-value">{activos.length}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="kd-filtros">
        {[
          { key: "todos",          label: "Activos"         },
          { key: "pendiente",      label: "Pendiente"       },
          { key: "en_preparacion", label: "En preparación"  },
          { key: "listo",          label: "Listo"           },
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

      <h2 className="kd-section-title">{tituloSeccion}</h2>

      {/* CONTENIDO */}
      {cargando ? (
        <p className="kd-empty">Cargando pedidos...</p>
      ) : filtrados.length === 0 ? (
        <p className="kd-empty">Sin pedidos en este estado 👨‍🍳</p>
      ) : (
        <div className="kd-grid">
          {filtrados.map(pedido => (
            <div
              key={pedido.id}
              className={`kd-card estado-${pedido.estado}`}
              onClick={() => setPedidoSel(pedido)}
              style={{ cursor: "pointer" }}
            >
              {/* Cabecera de la card */}
              <div className="kd-card-header">
                <div className="kd-card-mesa">
                  <span className={`kd-num estado-${pedido.estado}`}>
                    {pedido.mesa?.replace(/\D/g, "") || "?"}
                  </span>
                  <div>
                    <p className="kd-card-mesa-nombre">{pedido.mesa}</p>
                    <p className="kd-card-tiempo">{tiempoTranscurrido(pedido.hora)}</p>
                  </div>
                </div>
                <span className={`kd-badge estado-${pedido.estado}`}>
                  {ESTADO_LABEL[pedido.estado]}
                </span>
              </div>

              {/* Nota general del pedido */}
              {pedido.notas && (
                <p className="kd-card-nota">📋 {pedido.notas}</p>
              )}

              {/* Items con imagen */}
              <div className="kd-items">
                {pedido.items?.map((item, i) => {
                  const imagen = imagenes[item.imagen] || imagenes[item.imgKey] || null;
                  return (
                    <div key={i} className="kd-item">
                      {/* Imagen del plato */}
                      <div className="kd-item-img">
                        {imagen
                          ? <img src={imagen} alt={item.nombre} />
                          : <span className="kd-item-placeholder">🍽️</span>
                        }
                      </div>
                      <div className="kd-item-qty">{item.cantidad}x</div>
                      <div className="kd-item-info">
                        <p className="kd-item-nombre">{item.nombre}</p>
                        {item.observacion && (
                          <p className="kd-item-nota">📌 {item.observacion}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón avanzar estado */}
              {ESTADO_BTN[pedido.estado] && (
                <button
                  className={`kd-btn-avanzar estado-${pedido.estado}`}
                  onClick={e => { e.stopPropagation(); avanzarEstado(pedido); }}
                >
                  {ESTADO_BTN[pedido.estado]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;