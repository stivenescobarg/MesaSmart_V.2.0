// frontend/src/pages/BartenderDashboard.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Bartender.css";

const BartenderDashboard = () => {
  const { numero } = useParams(); // ← "numero" igual que la ruta /bartender/:numero
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("ordenes_bar")) || [];
    setOrdenes(data);
  }, []);

  const marcarListo = (index) => {
    const actualizadas = ordenes.map((o, i) =>
      i === index ? { ...o, estado: "listo" } : o
    );
    localStorage.setItem("ordenes_bar", JSON.stringify(actualizadas));
    setOrdenes(actualizadas);
  };

  const handleSalir = async () => {
    localStorage.removeItem("ms_token");
    await logout();
    navigate("/login", { replace: true });
  };

  const activas      = ordenes.filter((o) => o.estado !== "listo");
  const completadas  = ordenes.filter((o) => o.estado === "listo");
  const totalBebidas = ordenes.reduce((acc, o) => acc + (o.items?.length || 0), 0);

  return (
    <div className="bd-container">

      {/* ── HEADER ── */}
      <div className="bd-header">
        <div>
          <h1 className="bd-title">Panel de Bartender</h1>
          <p className="bd-subtitle">Bartender {numero} — turno activo</p>
        </div>
        <button className="btn-salir" onClick={handleSalir}>Salir →</button>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="bd-main">

        {/* Métricas */}
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

        {/* Lista de órdenes activas */}
        <h2 className="bd-section-title">Órdenes activas</h2>

        {activas.length === 0 ? (
          <p className="bd-empty">Sin órdenes pendientes 🍹</p>
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
                    ✓ Listo
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Completadas */}
        {completadas.length > 0 && (
          <>
            <h2 className="bd-section-title" style={{ marginTop: "1.75rem" }}>
              Completadas
            </h2>
            <div className="bd-orders">
              {ordenes.map((orden, i) =>
                orden.estado === "listo" ? (
                  <div key={i} className="order-card" style={{ opacity: 0.6 }}>
                    <div className="order-num listo">M{orden.mesa}</div>
                    <div className="order-info">
                      <p className="order-mesa">Mesa {orden.mesa}</p>
                      <p className="order-items">{orden.items?.join(" · ")}</p>
                    </div>
                    <span className="badge badge-listo">Listo</span>
                  </div>
                ) : null
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BartenderDashboard;