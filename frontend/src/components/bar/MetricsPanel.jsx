// src/components/bar/MetricsPanel.jsx
import BarActivityChart from "./BarActivityChart";

const consejos = [
  "💡 Organiza las copas por tipo para servir más rápido.",
  "🧊 Prepara el hielo al inicio del turno.",
  "⏱️ Los cócteles listos en menos de 10 min generan clientes felices.",
  "📋 Revisa el inventario cada 2 horas.",
  "🍊 Corta las frutas de guarnición al comenzar.",
  "⚡ Agrupa órdenes similares para optimizar tiempo.",
  "🤝 Comunica retrasos al cliente proactivamente.",
];

const MetricsPanel = ({ resumen = {}, ordenes = [], alertas = [] }) => {
  const hoy = new Date().toLocaleDateString("es-CO", { month: "short", day: "numeric" });
  const consejoDia = consejos[new Date().getDate() % consejos.length];

  const eficiencia = resumen.listas_hoy > 0 ? Math.min(100, Math.round((resumen.listas_hoy / Math.max(resumen.bebidas_hoy, 1)) * 100)) : 92;

  return (
    <aside className="bd-metrics-panel">
      {/* ALERTAS CRÍTICAS — solo aparece si hay algo bajo/agotado */}
      {alertas.length > 0 && (
        <div>
          <div className="bd-panel-header">
            <h3 className="bd-panel-title">
              <span className="bd-panel-icon">⚠️</span>
              Alertas críticas
            </h3>
          </div>
          <div className="bd-tip-card" style={{ borderColor: "var(--bar-danger)", display: "flex", flexDirection: "column", gap: "8px" }}>
            {alertas.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span>{item.nombre}</span>
                <strong style={{ color: "var(--bar-danger)" }}>{item.cantidad_actual}{item.unidad} <em style={{ opacity: 0.6, fontStyle: "normal" }}>/ mín {item.cantidad_minima}</em></strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRÁFICA DE ACTIVIDAD */}
      <div>
        <div className="bd-panel-header">
          <h3 className="bd-panel-title">
            <span className="bd-panel-icon">📈</span>
            Actividad en vivo
          </h3>
        </div>
        <BarActivityChart ordenes={ordenes} />
      </div>

      {/* RENDIMIENTO */}
      <div>
        <div className="bd-panel-header">
          <h3 className="bd-panel-title">
            <span className="bd-panel-icon">⚡</span>
            Rendimiento
          </h3>
        </div>
        <div className="bd-performance-card">
          <div className="bd-performance-label">Eficiencia del turno</div>
          <p className="bd-performance-value">{eficiencia}%</p>
          <div className="bd-performance-subtext">
            {resumen.listas_hoy || 0} bebidas completadas hoy
          </div>
        </div>
      </div>

      {/* CONSEJO DEL DÍA */}
      <div>
        <div className="bd-panel-header">
          <h3 className="bd-panel-title">
            <span className="bd-panel-icon">✨</span>
            Consejo del día
          </h3>
        </div>
        <div className="bd-tip-card">
          <div className="bd-tip-icon">🎯</div>
          <p className="bd-tip-text">{consejoDia}</p>
        </div>
      </div>

      {/* FOOTER CON FECHA Y HORA */}
      <div style={{ borderTop: "1px solid var(--bar-border-light)", paddingTop: "12px", marginTop: "4px" }}>
        <p style={{ fontSize: "10px", color: "var(--bar-text-2)", margin: "0", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
          Turno · {hoy}
        </p>
      </div>
    </aside>
  );
};

export default MetricsPanel;