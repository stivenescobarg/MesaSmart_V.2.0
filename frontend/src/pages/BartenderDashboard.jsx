//frontend/src/pages/BartenderDashboard.jsx (VERSIÓN NUEVA - Layout 3 columnas)
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { getImage } from "../utils/getImage";
import { barService } from "../services/barService";
import BarStock from "../components/bar/BarStock";
import SidebarNav from "../components/bar/SidebarNav";
import MetricsPanel from "../components/bar/MetricsPanel";
import "./BarLayout.css";
import "./Bartender.css";


const ESTADOS = {
  pendiente: { etiqueta: "Pendiente", accion: "Iniciar preparación", siguiente: "en_preparacion" },
  en_preparacion: { etiqueta: "En preparación", accion: "Marcar como listo", siguiente: "listo" },
  listo: { etiqueta: "Listo" },
};

const hora = fecha => new Date(fecha).toLocaleTimeString("es-CO", {
  hour: "2-digit", minute: "2-digit",
});

const hace = fecha => {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(fecha)) / 60000));
  return minutos < 1 ? "Ahora" : minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h`;
};

const Estado = ({ estado }) => <span className={`bd-status bd-status-${estado}`}>
  {ESTADOS[estado]?.etiqueta || estado}
</span>;

const DetalleOrden = ({ orden, onClose, onAvanzar, guardando }) => {
  if (!orden) return null;
  const configuracion = ESTADOS[orden.estado];
  return <div className="bd-modal-overlay" onClick={onClose}>
    <section className="bd-modal" onClick={event => event.stopPropagation()} aria-modal="true" role="dialog">
      <button className="bd-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
      <div className="bd-modal-header">
        <div>
          <p className="bd-eyebrow">Orden #{orden.id}</p>
          <h2 className="bd-modal-title">{orden.mesa}</h2>
          <p className="bd-modal-time">Recibida {hora(orden.creado_en)} · hace {hace(orden.creado_en)}</p>
        </div>
        <Estado estado={orden.estado} />
      </div>
      {orden.observacion && <p className="bd-order-note">📌 {orden.observacion}</p>}
      <div className="bd-modal-items">
        {orden.items.map((item, indice) => {
          const imagen = getImage(item.nombre, item.imagen || item.imgKey);
          return <article className="bd-modal-item" key={`${item.nombre}-${indice}`}>
            <div className="bd-modal-item-img">{imagen ? <img src={imagen} alt="" /> : "🍹"}</div>
            <div className="bd-modal-item-info">
              <p className="bd-modal-item-name">{item.nombre}</p>
              <p className="bd-modal-item-qty">Cantidad: {item.cantidad}</p>
              {item.opcion && <p className="bd-modal-item-opcion">{item.opcion}</p>}
              {item.adiciones?.length > 0 && <p className="bd-modal-item-desc">+ {item.adiciones.join(" · ")}</p>}
            </div>
          </article>;
        })}
      </div>
      {configuracion?.siguiente && <button className="bd-modal-btn-listo" disabled={guardando}
        onClick={() => onAvanzar(orden, configuracion.siguiente)}>
        {guardando ? "Actualizando..." : configuracion.accion}
      </button>}
    </section>
  </div>;
};

const OrderItemsPreview = ({ items }) => <div className="bd-items">
  {items?.slice(0, 4).map((item, indice) => {
    const img = getImage(item.nombre, item.imagen || item.imgKey);
    return <div key={indice} className="bd-item">
      <div className="bd-item-img">
        {img ? <img src={img} alt={item.nombre} /> : <span className="bd-item-placeholder">🍹</span>}
      </div>
      <span className="bd-item-qty">×{item.cantidad}</span>
      <p className="bd-item-nombre">{item.nombre}</p>
    </div>;
  })}
  {(items?.length || 0) > 4 && <p className="bd-items-mas">+{items.length - 4} más — toca para ver todo</p>}
</div>;

const BartenderDashboard = () => {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const { esOscuro, toggleThema } = useTheme();
  const [ordenes, setOrdenes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [resumen, setResumen] = useState({ activas: 0, pendientes: 0, en_preparacion: 0, listas_hoy: 0, bebidas_hoy: 0 });
  const [alertas, setAlertas] = useState([]);
  const [filtro, setFiltro] = useState("activas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("pedidos");
  const [navActual, setNavActual] = useState("pedidos");

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    try {
      const [activas, resumenBar, historialBar] = await Promise.all([
        barService.getActivas(), barService.getResumen(), barService.getHistorial(),
      ]);
      setOrdenes(activas.ordenes || []);
      setResumen(resumenBar.resumen || {});
      setAlertas(resumenBar.alertas_stock || []);
      setHistorial(historialBar.ordenes || []);
      setError("");
    } catch (err) {
      if (!silencioso) setError(err.message || "No fue posible conectar con el bar.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = window.setInterval(() => cargar({ silencioso: true }), 10000);
    return () => window.clearInterval(intervalo);
  }, [cargar]);

  const avanzar = async (orden, estado) => {
    setGuardando(true);
    try {
      await barService.actualizarEstado(orden.id, estado);
      setSeleccionada(null);
      await cargar();
    } catch (err) {
      setError(err.message || "No fue posible actualizar la orden.");
    } finally { setGuardando(false); }
  };

  const visibles = useMemo(() => filtro === "historial" ? historial : ordenes.filter(orden =>
    filtro === "activas" || orden.estado === filtro
  ), [filtro, ordenes, historial]);

  const salir = async () => { await logout(); navigate("/login", { replace: true }); };

  const handleNavChange = (nav) => {
    setNavActual(nav);
    if (nav === "inventario") setVista("inventario");
    else setVista("pedidos");
  };

  return <div className={`bd-container ${esOscuro ? "bd-dark" : "bd-light"}`}>
    {seleccionada && <DetalleOrden orden={seleccionada} onClose={() => setSeleccionada(null)}
      onAvanzar={avanzar} guardando={guardando} />}

    {/* HEADER */}
    <header className="bd-header" style={{ gridColumn: "1 / -1" }}>
      <div>
        <p className="bd-eyebrow">MesaSmart · operación en vivo</p>
        <h1 className="bd-title">🍹 <span>Bar</span></h1>
        <p className="bd-subtitle">{usuario?.nombre || "Bartender"} · turno activo · actualización cada 10 segundos</p>
      </div>
      <div className="bd-header-actions"><button className="bd-theme" onClick={toggleThema} title="Cambiar tema">
        {esOscuro ? "☀️ Claro" : "🌙 Oscuro"}</button><button className="btn-salir" onClick={salir}>Salir →</button></div>
    </header>

    {error && <div className="bd-error" style={{ gridColumn: "1 / -1" }}>⚠️ {error}<button onClick={() => cargar()}>Reintentar</button></div>}
    {alertas.length > 0 && <div className="bd-stock-alert" style={{ gridColumn: "1 / -1" }}>⚠️ Inventario bajo: {alertas.map(item => item.nombre).join(", ")}</div>}

    {/* LAYOUT 3 COLUMNAS */}
    <div className="bd-dashboard-wrapper">
      {/* SIDEBAR NAVEGACIÓN */}
      <SidebarNav
        vistaPedidos={() => setVista("pedidos")}
        vistaInventario={() => setVista("inventario")}
        vistaHistorial={() => setFiltro("historial")}
        onNavChange={handleNavChange}
        vistaActual={navActual}
      />

      {/* CONTENIDO CENTRAL */}
      <main className="bd-main-content">
        <nav className="bd-view-tabs" aria-label="Vistas del bar">
          <button className={vista === "pedidos" ? "activo" : ""} onClick={() => setVista("pedidos")}>📋 Pedidos</button>
          <button className={vista === "inventario" ? "activo" : ""} onClick={() => setVista("inventario")}>📦 Inventario</button>
        </nav>

        {vista === "inventario" ? <BarStock onActualizarResumen={cargar} /> : <>
          <section className="bd-metrics" aria-label="Resumen del turno">
            {[
              ["activas", "Órdenes activas", resumen.activas || 0],
              ["pendiente", "Pendientes", resumen.pendientes || 0],
              ["en_preparacion", "Preparando", resumen.en_preparacion || 0],
              ["historial", "Listas hoy", resumen.listas_hoy || 0],
            ].map(([clave, etiqueta, valor]) => <button key={clave}
              className={`metric-card ${filtro === clave ? "active" : ""}`} onClick={() => setFiltro(clave)}>
              <span className="metric-label">{etiqueta}</span><strong className="metric-value">{valor}</strong>
            </button>)}
          </section>

          <div className="bd-toolbar">
            <div>
              <h2 className="bd-section-title">{filtro === "historial" ? "Historial de hoy" : "Órdenes del bar"}</h2>
              <p>{resumen.bebidas_hoy || 0} bebidas registradas hoy</p>
            </div>
            <button className="bd-refresh" onClick={() => cargar()} disabled={cargando}>↻ Actualizar</button>
          </div>

          {cargando ? <div className="bd-empty">Cargando órdenes...</div> : visibles.length === 0 ? <div className="bd-empty">🍹 No hay órdenes en esta vista.</div> :
            <section className="bd-orders">
              {visibles.map(orden => <article key={orden.id} className="order-card"
                onClick={() => setSeleccionada(orden)}>
                <div className="order-num">{orden.mesa.replace(/^Mesa\s*/i, "M")}</div>
                <div className="order-info">
                  <div className="bd-card-top"><p className="order-mesa">{orden.mesa}</p><Estado estado={orden.estado} /></div>
                  <OrderItemsPreview items={orden.items} />
                  <p className="bd-card-time">{hora(orden.creado_en)} · hace {hace(orden.creado_en)}</p>
                </div>
                {ESTADOS[orden.estado]?.siguiente && <button className="btn-listo" disabled={guardando} onClick={event => {
                  event.stopPropagation(); avanzar(orden, ESTADOS[orden.estado].siguiente);
                }}>{ESTADOS[orden.estado].accion}</button>}
              </article>)}
            </section>}
        </>}
      </main>

      {/* PANEL MÉTRICAS DERECHA */}
      <MetricsPanel resumen={resumen} ordenes={ordenes}  alertas={alertas} />
    </div>
  </div>;
};

export default BartenderDashboard;