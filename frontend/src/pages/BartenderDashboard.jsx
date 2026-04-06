import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Bartender.css";

const BartenderDashboard = () => {
  const { numero } = useParams();
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [ordenes, setOrdenes]   = useState([]);
  const [ordenSel, setOrdenSel] = useState(null);

  const cargarOrdenes = async () => {
    try {
      const res  = await fetch("http://localhost:3001/api/bar/ordenes");
      const data = await res.json();
      setOrdenes(data);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const marcarListo = async (orden) => {
    try {
      await fetch(`http://localhost:3001/api/bar/orden/${orden.id}`, {
        method: "PATCH",
      });
      cargarOrdenes();
    } catch (err) {
      console.error("Error marcando listo:", err);
    }
  };

  const handleSalir = async () => {
    localStorage.removeItem("ms_token");
    await logout();
    navigate("/login", { replace: true });
  };

  const activas     = ordenes.filter(o => o.estado !== "listo");
  const completadas = ordenes.filter(o => o.estado === "listo");

  return (
    <div className="bd-container">

      {/* HEADER */}
      <div className="bd-header">
        <div>
          <h1 className="bd-title">Panel de Bartender</h1>
          <p className="bd-subtitle">Bartender {numero} — turno activo</p>
        </div>
        <button className="btn-salir" onClick={handleSalir}>Salir →</button>
      </div>

      <div className="bd-main">

        {/* MÉTRICAS */}
        <div className="bd-metrics">
          <div className="metric-card">
            <p className="metric-label">Órdenes activas</p>
            <p className="metric-value">{activas.length}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Completadas</p>
            <p className="metric-value">{completadas.length}</p>
          </div>
        </div>

        {/* ACTIVAS */}
        <h2 className="bd-section-title">Órdenes activas</h2>

        {activas.length === 0 ? (
          <p className="bd-empty">Sin órdenes pendientes 🍹</p>
        ) : (
          <div className="bd-orders">
            {activas.map((orden) => (
              <div
                key={orden.id}
                className="order-card"
                onClick={() => setOrdenSel(orden)}
              >
                <div className="order-num pendiente">
                  M{orden.mesa}
                </div>
                <div className="order-info">
                  <p className="order-mesa">{orden.mesa}</p>
                  <p className="order-items">
                    {orden.items?.join(" · ")}
                  </p>
                </div>
                <span className="badge badge-pendiente">Pendiente</span>
              </div>
            ))}
          </div>
        )}

        {/* COMPLETADAS */}
        {completadas.length > 0 && (
          <>
            <h2 className="bd-section-title" style={{ marginTop: "1.75rem" }}>
              Completadas
            </h2>
            <div className="bd-orders">
              {completadas.map((orden) => (
                <div key={orden.id} className="order-card" style={{ opacity: 0.6 }}>
                  <div className="order-num listo">M{orden.mesa}</div>
                  <div className="order-info">
                    <p className="order-mesa">{orden.mesa}</p>
                    <p className="order-items">
                      {orden.items?.join(" · ")}
                    </p>
                  </div>
                  <span className="badge badge-listo">Listo</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* MODAL */}
      {ordenSel && (
        <OrdenModal
          orden={ordenSel}
          onClose={() => setOrdenSel(null)}
          onListo={marcarListo}
        />
      )}
    </div>
  );
};

export default BartenderDashboard;