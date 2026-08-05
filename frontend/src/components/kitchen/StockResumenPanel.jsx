// frontend/src/components/kitchen/StockResumenPanel.jsx
// Panel derecho de la vista Stock: donut de resumen + alertas críticas.
// Recibe `productos` (mismo array que ya carga StockCocina) — no hace fetch propio.

const clasificar = (p) => {
  const pct = p.cantidad_actual / Math.max(p.cantidad_minima, 1);
  if (p.cantidad_actual <= 0) return "sinStock";
  if (pct <= 1)               return "critico";
  if (pct <= 1.5)              return "bajo";
  return "ok";
};

const NIVELES = [
  { key: "ok",       label: "OK",        color: "#22c55e" },
  { key: "bajo",      label: "Bajo",      color: "#f59e0b" },
  { key: "critico",   label: "Crítico",   color: "#ef4444" },
  { key: "sinStock",  label: "Sin stock", color: "#8b5cf6" },
];

const StockResumenPanel = ({ productos }) => {
  const total = productos.length;

  const conteos = NIVELES.map(n => ({
    ...n,
    cantidad: productos.filter(p => clasificar(p) === n.key).length,
  }));

  // Armamos el gradiente cónico del donut a partir de los porcentajes
  let acumulado = 0;
  const stops = conteos.map(n => {
    const pct = total > 0 ? (n.cantidad / total) * 100 : 0;
    const desde = acumulado;
    acumulado += pct;
    return `${n.color} ${desde}% ${acumulado}%`;
  }).join(", ");

  const criticos = productos
    .filter(p => ["critico", "sinStock"].includes(clasificar(p)))
    .sort((a, b) => (a.cantidad_actual / a.cantidad_minima) - (b.cantidad_actual / b.cantidad_minima))
    .slice(0, 5);

  return (
    <aside className="kc-panel-right">

      {/* ── Resumen de inventario (donut) ── */}
      <div className="kc-panel-card">
        <p className="kc-panel-title">📊 Resumen de inventario</p>
        <div className="kc-donut-wrap">
          <div
            className="kc-donut"
            style={{ background: total > 0 ? `conic-gradient(${stops})` : "var(--kc-border)" }}
          >
            <div className="kc-donut-center">
              <p className="kc-donut-value">{total}</p>
              <p className="kc-donut-label">Ingredientes</p>
            </div>
          </div>
          <div className="kc-donut-legend">
            {conteos.map(n => (
              <div key={n.key} className="kc-donut-legend-item">
                <span>
                  <span className="kc-donut-dot" style={{ background: n.color }} />
                  {n.label}
                </span>
                <span>{n.cantidad} ({total > 0 ? Math.round((n.cantidad / total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Valor estimado (placeholder honesto, falta campo precio) ── */}
      <div className="kc-panel-card">
        <p className="kc-panel-title">💰 Valor estimado del inventario</p>
        <p style={{ fontSize: "0.78rem", color: "var(--kc-text-muted)" }}>
          Aún no hay un precio por producto guardado en el inventario, así que no podemos calcular esto con datos reales todavía.
        </p>
      </div>

      {/* ── Alertas críticas ── */}
      <div className="kc-panel-card">
        <p className="kc-panel-title">⚠️ Alertas críticas</p>
        {criticos.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--kc-text-muted)" }}>Sin alertas por ahora ✅</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {criticos.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span style={{ color: "var(--kc-text-secondary)" }}>{p.nombre}</span>
                <span style={{ color: "#ef4444", fontFamily: "JetBrains Mono, monospace" }}>
                  {p.cantidad_actual} {p.unidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default StockResumenPanel;