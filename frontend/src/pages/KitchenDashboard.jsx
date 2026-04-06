import { useState, useEffect, useRef, useCallback } from "react";
import { kitchenService } from "../services/kitchenService";
import OrderCard from "../components/kitchen/OrderCard";
import KitchenHeader from "../components/kitchen/KitchenHeader";
import "./KitchenDashboard.css";

// Estados que el dashboard de cocina muestra (no entregado/cancelado)
const ESTADOS_ORDEN = { pendiente: 0, en_preparacion: 1, listo: 2 };

export default function KitchenDashboard() {
  const [theme, setTheme]           = useState(() => localStorage.getItem("kitchen-theme") || "dark");
  const [orders, setOrders]         = useState([]);
  const [filtro, setFiltro]         = useState("todos");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [nuevoPedido, setNuevoPedido] = useState(false);
  const [cocinero, setCocinero]     = useState(null);

  const prevOrderIds = useRef(new Set());

  // Persistir tema
  useEffect(() => {
    localStorage.setItem("kitchen-theme", theme);
    document.documentElement.setAttribute("data-kitchen-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === "dark" ? "light" : "dark");
  }, []);

  // Cargar cocinero en turno
  useEffect(() => {
    kitchenService.getCocineroTurno()
      .then(setCocinero)
      .catch(() => setCocinero({ nombre: "Sin asignar", turno: "mock" }));
  }, []);

  // Carga inicial
  const cargarPedidos = useCallback(async () => {
    try {
      setError(null);
      const data = await kitchenService.getOrders();
      setOrders(data);
      prevOrderIds.current = new Set(data.map(o => o.id));
    } catch (err) {
      setError("No se pudo conectar con el servidor. Reintentando...");
      console.error("[KitchenDashboard]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Polling via subscribe
  useEffect(() => {
    const unsub = kitchenService.subscribe((updatedOrders) => {
      const newIds = new Set(updatedOrders.map(o => o.id));
      const hayNuevo = [...newIds].some(id => !prevOrderIds.current.has(id));

      if (hayNuevo) {
        setNuevoPedido(true);
        playAlerta();
        setTimeout(() => setNuevoPedido(false), 3000);
      }

      prevOrderIds.current = newIds;
      setOrders(updatedOrders);
      setError(null);
    });

    return () => unsub();
  }, []);

  const playAlerta = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 150, 300].forEach((delay) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        const t = ctx.currentTime + delay / 1000;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (_) {}
  };

  const handleUpdateStatus = useCallback(async (orderId, nuevoEstado) => {
  try {
    await kitchenService.updateOrderStatus(orderId, nuevoEstado);
    // Actualizar localmente de inmediato
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, estado: nuevoEstado } : o)
    );
    // Luego traer datos frescos del servidor
    const data = await kitchenService.getOrders();
    setOrders(data);
  } catch (err) {
    console.error("[handleUpdateStatus]", err);
    alert("Error al actualizar el estado. Intenta de nuevo.");
  }
}, []);

  const ordenesFiltradas = orders
    .filter(o => filtro === "todos" || o.estado === filtro)
    .sort((a, b) => (ESTADOS_ORDEN[a.estado] ?? 99) - (ESTADOS_ORDEN[b.estado] ?? 99));

  // ─── Render: Loading ──────────────────────────
  if (loading) {
    return (
      <div className="kd-root" data-theme={theme}>
        <div className="kd-loading">
          <div className="kd-spinner" />
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  // ─── Render: Dashboard ────────────────────────
  return (
    <div className="kd-root" data-theme={theme}>
      {nuevoPedido && (
        <div className="kd-alerta" role="alert">
          🔔 ¡Nuevo pedido entrante!
        </div>
      )}

      {error && (
        <div className="kd-error-banner" role="alert">
          ⚠ {error}
          <button onClick={cargarPedidos}>Reintentar</button>
        </div>
      )}

      <KitchenHeader
        orders={orders}
        filtro={filtro}
        onFiltroChange={setFiltro}
        theme={theme}
        onToggleTheme={toggleTheme}
        cocinero={cocinero}
      />

      <main className="kd-main">
        {ordenesFiltradas.length === 0 ? (
          <div className="kd-empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="2"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <p>
              {filtro === "todos"
                ? "No hay pedidos activos"
                : `No hay pedidos ${filtro === "pendiente" ? "pendientes"
                  : filtro === "en_preparacion" ? "en preparación"
                  : "listos"}`}
            </p>
          </div>
        ) : (
          <div className="kd-grid">
            {ordenesFiltradas.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                theme={theme}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const KitchenDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSalir = async () => {
    console.log('Token antes:', localStorage.getItem('ms_token'));
    await logout();
    console.log('Token después:', localStorage.getItem('ms_token'));

    navigate("/login");
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "20px" }}>
      <button onClick={handleSalir}>Salir</button>
      <h1>Panel de Cocina {id}</h1>
    </div>
  );
};

export default KitchenDashboard;
