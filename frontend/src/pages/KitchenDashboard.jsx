import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Kitchen.css";

const ESTADOS = ["recibido", "en_preparacion", "listo"];
const ESTADO_LABEL = { recibido: "Recibido", en_preparacion: "En preparación", listo: "Listo" };
const ESTADO_NEXT  = { recibido: "en_preparacion", en_preparacion: "listo" };
const ESTADO_BTN   = { recibido: "Iniciar preparación", en_preparacion: "Marcar listo" };

const KitchenDashboard = () => {
  const navigate   = useNavigate();
  const { logout } = useAuth();

  const [pedidos,    setPedidos]    = useState([]);
  const [filtro,     setFiltro]     = useState("todos");
  const [expandido,  setExpandido]  = useState(null);
  const [cargando,   setCargando]   = useState(true);

  const cargar = async () => {
    try {
      const res  = await fetch("http://localhost:3001/api/pedidos");
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch {
      // fallback mock para demostración
      setPedidos([
        {
          id: 1, mesa: "Mesa 3", estado: "recibido",
          hora: new Date().toISOString(), notas: "Sin cebolla",
          items: [
            { nombre: "Hamburguesa Especial", cantidad: 2, notas: "Sin cebolla", categoria_label: "Platos fuertes" },
            { nombre: "Alitas BBQ",           cantidad: 1, notas: "",            categoria_label: "Platos fuertes" },
          ],
        },
        {
          id: 2, mesa: "Mesa 7", estado: "en_preparacion",
          hora: new Date(Date.now() - 8 * 60000).toISOString(), notas: "",
          items: [
            { nombre: "Bandeja Paisa",  cantidad: 1, notas: "",         categoria_label: "Platos típicos" },
            { nombre: "Carbonara Clásica", cantidad: 2, notas: "Extra queso", categoria_label: "Pastas" },
          ],
        },
        {
          id: 3, mesa: "Mesa 1", estado: "listo",
          hora: new Date(Date.now() - 20 * 60000).toISOString(), notas: "",
          items: [
            { nombre: "Roll California", cantidad: 3, notas: "", categoria_label: "Sushi" },
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

  const avanzarEstado = async (pedido) => {
    const nuevoEstado = ESTADO_NEXT[pedido.estado];
    if (!nuevoEstado) return;
    try {
      await fetch(`http://localhost:3001/api/pedidos/${pedido.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {}
    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)
    );
  };

  const handleSalir = async () => { await logout(); navigate("/login", { replace: true }); };

  const tiempoTranscurrido = (hora) => {
    const min = Math.floor((Date.now() - new Date(hora)) / 60000);
    if (min < 1)  return "ahora";
    if (min < 60) return `${min} min`;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  const filtrados = pedidos.filter(p =>
    filtro === "todos" ? p.estado !== "listo" : p.estado === filtro
  );
  const listos    = pedidos.filter(p => p.estado === "listo");
  const activos   = pedidos.filter(p => p.estado !== "listo");

  return (
    <div className="kd-container">
      <div className="kd-header">
        <div>
          <h1 className="kd-title">Panel de Cocina</h1>
          <p className="kd-subtitle">Panel de cocina — turno activo</p>
        </div>
        <button className="kd-salir" onClick={handleSalir}>Salir</button>
      </div>

      <div className="kd-metrics">
        <div className="kd-metric">
          <p className="kd-metric-label">Pendientes</p>
          <p className="kd-metric-value orange">{pedidos.filter(p => p.estado === "recibido").length}</p>
        </div>
        <div className="kd-metric">
          <p className="kd-metric-label">En preparación</p>
          <p className="kd-metric-value blue">{pedidos.filter(p => p.estado === "en_preparacion").length}</p>
        </div>
        <div className="kd-metric">
          <p className="kd-metric-label">Listos hoy</p>
          <p className="kd-metric-value green">{listos.length}</p>
        </div>
        <div className="kd-metric">
          <p className="kd-metric-label">Total activos</p>
          <p className="kd-metric-value">{activos.length}</p>
        </div>
      </div>

      <div className="kd-filtros">
        {["todos", "recibido", "en_preparacion", "listo"].map(f => (
          <button key={f} className={`kd-filtro-btn ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
            {f === "todos" ? "Activos" : ESTADO_LABEL[f]}
          </button>
        ))}
      </div>

      <h2 className="kd-section-title">
        {filtro === "todos" ? "Órdenes activas" : ESTADO_LABEL[filtro]}
      </h2>

      {cargando ? (
        <p className="kd-empty">Cargando pedidos...</p>
      ) : filtrados.length === 0 ? (
        <p className="kd-empty">Sin pedidos en este estado</p>
      ) : (
        <div className="kd-grid">
          {filtrados.map(pedido => (
            <div key={pedido.id} className={`kd-card estado-${pedido.estado}`}>
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

              {pedido.notas && (
                <p className="kd-card-nota">Nota: {pedido.notas}</p>
              )}

              <div className="kd-items">
                {pedido.items?.map((item, i) => (
                  <div key={i} className="kd-item">
                    <div className="kd-item-qty">{item.cantidad}x</div>
                    <div className="kd-item-info">
                      <p className="kd-item-nombre">{item.nombre}</p>
                      <p className="kd-item-cat">{item.categoria_label}</p>
                      {item.notas && <p className="kd-item-nota">{item.notas}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {ESTADO_BTN[pedido.estado] && (
                <button className={`kd-btn-avanzar estado-${pedido.estado}`} onClick={() => avanzarEstado(pedido)}>
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