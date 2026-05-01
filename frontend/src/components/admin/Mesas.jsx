// frontend/src/components/admin/Mesas.jsx
// Con toggle entre vista GRID y vista PLANO del restaurante

import { useState, useEffect } from "react";
import DetalleMesa       from "./DetalleMesa";
import PlanoRestaurante  from "./PlanoRestaurante";
import { zonaService }   from "../../services/zonaService";

const Mesas = ({
  mesas,
  cajaAbierta,
  onCrearMesa,
  onEliminarMesa,
  onModificarItem,
  onEliminarItem,   // ← NUEVO
  onMoverItems,     // ← NUEVO
  onPagoTotal,
  onPagoParcial,
  onRecargar,
  toast,
}) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [nombreNuevaMesa,  setNombreNuevaMesa]  = useState("");
  const [modoCrear,        setModoCrear]         = useState(false);
  const [modoEliminar,     setModoEliminar]      = useState(false);
  const [vistaPlano,       setVistaPlano]        = useState(false);
  const [zonas,            setZonas]             = useState([]);
  const [zonaFiltro,       setZonaFiltro]        = useState(null);

  const libres   = mesas.filter(m => !m.ocupada).length;
  const ocupadas = mesas.filter(m => m.ocupada).length;

  useEffect(() => {
    zonaService.getAll()
      .then(data => setZonas(data.zonas || []))
      .catch(() => {});
  }, [mesas]);

  const handleCrear = () => {
    if (!nombreNuevaMesa.trim()) return;
    onCrearMesa(nombreNuevaMesa.trim(), zonaFiltro);
    setNombreNuevaMesa("");
    setModoCrear(false);
  };

  // ── Detalle de mesa ────────────────────────────────────────────
  if (mesaSeleccionada) {
    const mesaActual = mesas.find(m => m.id === mesaSeleccionada.id) || mesaSeleccionada;
    return (
      <DetalleMesa
        mesa={mesaActual}
        mesas={mesas}                          // ← NUEVO: para el modal de mover
        cajaAbierta={cajaAbierta}
        // ✅ FIX: ya no envuelve con (index, delta) — pasa directamente
        onModificarItem={onModificarItem}
        onEliminarItem={onEliminarItem}        // ← NUEVO
        onMoverItems={onMoverItems}            // ← NUEVO
        onPagoTotal={async (metodo) => {
          await onPagoTotal(mesaActual, metodo);
          setMesaSeleccionada(null);
        }}
        onPagoParcial={async (items, metodo) => {
          await onPagoParcial(mesaActual, items, metodo);
          const mesaPost = mesas.find(m => m.id === mesaActual.id);
          if (mesaPost && mesaPost.pedido.length === 0) setMesaSeleccionada(null);
        }}
        onVolver={() => setMesaSeleccionada(null)}
      />
    );
  }

  const mesasFiltradas = zonaFiltro
    ? mesas.filter(m => m.zona_id === zonaFiltro)
    : mesas;

  return (
    <div className="seccion-container">

      {/* ── ENCABEZADO ── */}
      <div className="seccion-header">
        <h2 className="seccion-titulo">Mesas del restaurante</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="chip chip-verde">{libres} libres</span>
          <span className="chip chip-amber">{ocupadas} ocupadas</span>

          <div className="tab-selector">
            <button className={`tab-btn ${!vistaPlano ? "activo" : ""}`}
              onClick={() => setVistaPlano(false)}>
              ⊞ Grid
            </button>
            <button className={`tab-btn ${vistaPlano ? "activo" : ""}`}
              onClick={() => setVistaPlano(true)}>
              🗺️ Plano
            </button>
          </div>
        </div>
      </div>

      {!cajaAbierta && (
        <div className="alerta-info">
          ⚠️ La caja está cerrada. Los pagos no se podrán registrar.
        </div>
      )}

      {/* ══ VISTA PLANO ══════════════════════════════════════════ */}
      {vistaPlano ? (
        <PlanoRestaurante
          mesas={mesas}
          zonas={zonas}
          onMesaClick={setMesaSeleccionada}
          onRecargar={onRecargar}
          toast={toast}
        />
      ) : (
        <>
          {zonas.length > 0 && (
            <div className="tab-selector" style={{ marginBottom: "0.75rem", width: "fit-content" }}>
              <button className={`tab-btn ${zonaFiltro === null ? "activo" : ""}`}
                onClick={() => setZonaFiltro(null)}>
                Todas
              </button>
              {zonas.map(z => (
                <button key={z.id}
                  className={`tab-btn ${zonaFiltro === z.id ? "activo" : ""}`}
                  onClick={() => setZonaFiltro(z.id === zonaFiltro ? null : z.id)}>
                  <span style={{
                    display: "inline-block", width: "8px", height: "8px",
                    borderRadius: "50%", background: z.color, marginRight: "4px",
                  }} />
                  {z.nombre}
                </button>
              ))}
            </div>
          )}

          <div className="mesas-acciones">
            {!modoCrear ? (
              <button className="btn-secundario" onClick={() => setModoCrear(true)}>
                + Nueva mesa
              </button>
            ) : (
              <div className="crear-mesa-form">
                <input
                  className="campo-input campo-inline"
                  placeholder="Nombre de la mesa (ej: Mesa Bar)"
                  value={nombreNuevaMesa}
                  onChange={e => setNombreNuevaMesa(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCrear()}
                  autoFocus
                />
                <button className="btn-primario" onClick={handleCrear}>Crear</button>
                <button className="btn-ghost" onClick={() => setModoCrear(false)}>Cancelar</button>
              </div>
            )}

            <button
              className={`btn-ghost ${modoEliminar ? "btn-ghost-activo" : ""}`}
              onClick={() => setModoEliminar(!modoEliminar)}
            >
              {modoEliminar ? "Listo" : "✕ Eliminar mesa"}
            </button>
          </div>

          <div className="mesas-grid">
            {mesasFiltradas.map(mesa => (
              <div
                key={mesa.id}
                className={`mesa-card ${mesa.ocupada ? "ocupada" : "libre"} ${modoEliminar ? "modo-eliminar" : ""}`}
                onClick={() => !modoEliminar && setMesaSeleccionada(mesa)}
              >
                <div
                  className="mesa-barra"
                  style={{
                    background: mesa.ocupada
                      ? "var(--amber)"
                      : (zonas.find(z => z.id === mesa.zona_id)?.color || "var(--green)"),
                  }}
                />

                <div className="mesa-contenido">
                  <p className="mesa-nombre">{mesa.nombre}</p>

                  {mesa.zona_nombre && (
                    <p style={{ fontSize: "0.68rem", color: mesa.zona_color || "var(--text-3)", marginBottom: "0.15rem", fontFamily: "'DM Mono', monospace" }}>
                      {mesa.zona_nombre}
                    </p>
                  )}

                  <p className="mesa-estado-texto">
                    {mesa.ocupada ? `${mesa.pedido?.length || 0} item(s)` : `👥 ${mesa.capacidad || 4} personas`}
                  </p>
                  {mesa.ocupada && (
                    <p className="mesa-total">
                      ${(mesa.total || 0).toLocaleString("es-CO")}
                    </p>
                  )}
                </div>

                {modoEliminar && !mesa.ocupada && (
                  <button className="btn-eliminar-mesa"
                    onClick={e => { e.stopPropagation(); onEliminarMesa(mesa.id); }}>
                    ✕
                  </button>
                )}
                {modoEliminar && mesa.ocupada && (
                  <div className="mesa-bloqueada" title="Mesa con pedidos activos">🔒</div>
                )}
              </div>
            ))}
          </div>

          {mesasFiltradas.length === 0 && (
            <div className="estado-vacio">
              <p>{zonaFiltro ? "No hay mesas en esta zona." : "No hay mesas registradas."}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Mesas;