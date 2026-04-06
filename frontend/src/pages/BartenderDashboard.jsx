import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Bartender.css";

const OrdenModal = ({ orden, onClose, onListo }) => {
  if (!orden) return null;
  return (
    <div className="bd-modal-overlay" onClick={onClose}>
      <div className="bd-modal" onClick={e => e.stopPropagation()}>
        <div className="bd-modal-handle" />
        <button className="bd-modal-close" onClick={onClose}>✕</button>
        <div className="bd-modal-header">
          <h2 className="bd-modal-title">{orden.mesa}</h2>
          <span className="badge badge-pendiente">Pendiente</span>
        </div>
        <p className="bd-modal-time">
          🕐 {new Date(orden.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="bd-modal-items">
          {orden.items?.map((item, i) => {
            const nombre    = typeof item === "object" ? item.nombre   : item.replace(/ x\d+$/, "");
            const cantidad  = typeof item === "object" ? item.cantidad : (item.match(/ x(\d+)$/)?.[1] || "1");
            const imgKey    = typeof item === "object" ? item.imgKey   : null;
            const adiciones = typeof item === "object" ? (item.adiciones || []) : [];
            const opcion    = typeof item === "object" ? item.opcion   : null;
            const imagen    = imgKey ? imagenes[imgKey] : null;

            return (
              <div key={i} className="bd-modal-item">
                <div className="bd-modal-item-img">
                  {imagen
                    ? <img src={imagen} alt={nombre} />
                    : <span>🍹</span>
                  }
                </div>
                <div className="bd-modal-item-info">
                  <p className="bd-modal-item-name">{nombre}</p>
                  <p className="bd-modal-item-qty">Cantidad: {cantidad}</p>
                  {typeof item === "object" && item.descripcion && (
                    <p className="bd-modal-item-desc">{item.descripcion}</p>
                  )}
                  {opcion && (
                    <p className="bd-modal-item-opcion">📌 {opcion}</p>
                  )}
                  {adiciones.length > 0 && (
                    <div className="bd-modal-item-adiciones">
                      {adiciones.map((a, j) => (
                        <span key={j} className="bd-adicion-tag">+ {a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className="bd-modal-btn-listo" onClick={() => { onListo(orden); onClose(); }}>
          ✅ Marcar como listo
        </button>
      </div>
    </div>
  );
};

const BartenderDashboard = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [ordenes,  setOrdenes]  = useState([]);
  const [ordenSel, setOrdenSel] = useState(null);
const BartenderDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("ordenes_bar")) || [];
    setOrdenes(data);
  }, []);

  const marcarListo = async (orden) => {
    try {
      await fetch(`http://localhost:3001/api/bar/orden/${orden.id}`, { method: "PATCH" });
      cargarOrdenes();
    } catch (err) {
      console.error("Error marcando listo:", err);
    }
  };

  const handleSalir = async () => {
    await logout();
    navigate("/login", { replace: true });
  const marcarListo = (index) => {
    const actualizadas = ordenes.map((o, i) =>
      i === index ? { ...o, estado: "listo" } : o
    );
    localStorage.setItem("ordenes_bar", JSON.stringify(actualizadas));
    setOrdenes(actualizadas);
  };

  const activas      = ordenes.filter((o) => o.estado !== "listo");
  const completadas  = ordenes.filter((o) => o.estado === "listo");
  const totalBebidas = ordenes.reduce((acc, o) => acc + (o.items?.length || 0), 0);

  return (
    <div className="bd-container">

      <div className="bd-header">
        <div>
          <h1 className="bd-title">Panel de Bartender</h1>
          <p className="bd-subtitle">Bartender {id} — turno activo</p>
        </div>
        <button className="btn-salir" onClick={handleSalir}>Salir</button>
      </div>

      <div className="bd-metrics">
        <div className="metric-card">
          <p className="metric-label">Órdenes activas</p>
          <p className="metric-value">{activas.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Completadas hoy</p>
          <p className="metric-value">{completadas.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Total bebidas</p>
          <p className="metric-value">{totalBebidas}</p>
        </div>
      </div>

      <h2 className="bd-section-title">Órdenes activas</h2>

      {activas.length === 0 ? (
        <p className="bd-empty">Sin órdenes pendientes 🍹</p>
      ) : (
        <div className="bd-orders">
          {activas.map((orden) => (
            <div key={orden.id} className="order-card" onClick={() => setOrdenSel(orden)}>
              <div className="order-num pendiente">
                M{orden.mesa?.replace(/\D/g, "") || "?"}
              </div>
              <div className="order-info">
                <p className="order-mesa">{orden.mesa}</p>
                <p className="order-items">
                  {orden.items?.map(getNombreItem).join(" · ")}
                </p>
        <p className="bd-empty">Sin órdenes pendientes</p>
      ) : (
        <div className="bd-orders">
          {ordenes.map((orden, i) =>
            orden.estado !== "listo" ? (
              <div key={i} className="order-card">
                <div className="order-num pendiente">M{orden.mesa}</div>
                <div className="order-info">
                  <p className="order-mesa">Mesa {orden.mesa}</p>
                  <p className="order-items">{orden.items?.join(" · ")}</p>
                </div>
                <span className="badge badge-pendiente">Pendiente</span>
                <button className="btn-listo" onClick={() => marcarListo(i)}>
                  Listo
                </button>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

export default BartenderDashboard;