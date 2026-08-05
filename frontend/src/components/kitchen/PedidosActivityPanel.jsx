// frontend/src/components/kitchen/PedidosActivityPanel.jsx
// Panel derecho de la vista Pedidos: actividad reciente + rendimiento + consejo del día.
// No hace fetch propio: recibe todo por props desde KitchenDashboard.

const CONSEJOS = [
  "Organiza los pedidos por tiempos para mejorar la eficiencia en cocina.",
  "Revisa el stock crítico antes de iniciar el turno para evitar sorpresas.",
  "Marca un pedido como 'en preparación' apenas lo tomes, así el mesero sabe que ya vas por él.",
  "Los pedidos urgentes (+15 min) deben salir primero, sin excepción.",
  "Un inventario actualizado a diario evita pérdidas por vencimiento.",
];

const consejoDelDia = () => {
  const dia = new Date().getDate();
  return CONSEJOS[dia % CONSEJOS.length];
};

const PedidosActivityPanel = ({ actividad, tiempoPromedio, completados, eficiencia }) => {
  return (
    <aside className="kc-panel-right">

      {/* ── Actividad en tiempo real ── */}
      <div className="kc-panel-card">
        <p className="kc-panel-title">🟢 Actividad en tiempo real</p>
        {actividad.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--kc-text-muted)" }}>Sin movimientos recientes.</p>
        ) : (
          <div>
            {actividad.map(ev => (
              <div key={ev.id} className="kc-activity-item">
                <span className="kc-activity-dot" />
                <div>
                  <p className="kc-activity-texto">{ev.texto}</p>
                  <p className="kc-activity-hora">
                    {ev.hora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Rendimiento actual ── */}
      <div className="kc-panel-card">
        <p className="kc-panel-title">📈 Rendimiento actual — Hoy</p>
        <div className="kc-rendimiento-grid">
          <div className="kc-rendimiento-item">
            <p className="kc-rendimiento-valor">{tiempoPromedio}</p>
            <p className="kc-rendimiento-label">Tiempo prom.</p>
          </div>
          <div className="kc-rendimiento-item">
            <p className="kc-rendimiento-valor">{completados}</p>
            <p className="kc-rendimiento-label">Completados</p>
          </div>
          <div className="kc-rendimiento-item" style={{ gridColumn: "1 / -1" }}>
            <p className="kc-rendimiento-valor">{eficiencia}%</p>
            <p className="kc-rendimiento-label">Eficiencia</p>
          </div>
        </div>
      </div>

      {/* ── Consejo del día ── */}
      <div className="kc-tip-card">
        <strong>💡 Consejo del día</strong>
        <p style={{ marginTop: "0.4rem" }}>{consejoDelDia()}</p>
      </div>
    </aside>
  );
};

export default PedidosActivityPanel;