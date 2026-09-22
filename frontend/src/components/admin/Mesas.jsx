// frontend/src/components/admin/Mesas.jsx
// Con toggle entre vista GRID y vista PLANO del restaurante
//
// ✅ CAMBIO: los wrappers de onPagoTotal / onPagoParcial ahora reciben y
// reenvían un tercer/segundo argumento `resumen` (consumo, descuento,
// servicio, propina, total) que viene desde DetalleMesa.jsx. Es aditivo:
// si el `onPagoTotal`/`onPagoParcial` que te pasan como prop a este
// componente todavía no lo espera, simplemente lo ignora y todo sigue
// funcionando igual que antes.
//
// ✅ NUEVO — FORMULARIO COMPLETO DE MESA: al pulsar "+ Nueva mesa" ya no sale
// solo un campo de nombre. Ahora se puede elegir nombre, zona (lista real de
// zonas), capacidad, forma y posición inicial en el plano — los mismos campos
// que tiene la tabla `mesas` en la base de datos. `onCrearMesa` se sigue
// llamando con (nombre, zona_id) como antes y recibe un TERCER argumento
// opcional con el resto de los datos: { zona_id, capacidad, forma, pos_x, pos_y }.

import { useState, useEffect } from "react";
import { createPortal }  from "react-dom";
import DetalleMesa       from "./DetalleMesa";
import PlanoRestaurante  from "./PlanoRestaurante";
import { zonaService }   from "../../services/zonaService";
import { pedidoService } from "../../services/pedidoService";
import { barService }    from "../../services/barService";

// Formas disponibles para una mesa (columna `forma` en la BD).
const FORMAS_MESA = [
  { valor: "cuadrada",    etiqueta: "Cuadrada" },
  { valor: "redonda",     etiqueta: "Redonda" },
  { valor: "rectangular", etiqueta: "Rectangular" },
];

// Valores iniciales del formulario. La zona arranca en la que esté filtrada
// en ese momento (igual que antes), y la posición en 20/20 como las mesas nuevas.
const formInicial = (zonaId = null) => ({
  nombre:    "",
  zona_id:   zonaId ?? "",
  capacidad: 4,
  forma:     "cuadrada",
  pos_x:     20,
  pos_y:     20,
});

// ── Modal: pedidos que llegaron por QR y esperan aprobación ─────────
const ModalConfirmarPedidos = ({ mesa, onConfirmar, onCerrar }) => {
  const [procesando, setProcesando] = useState(null); // id del grupo en curso

  // Agrupa por pedido_id (cocina) o __ordenBarId (bar) — cada grupo se
  // confirma con un solo click, aunque tenga varios items adentro.
  const grupos = [];
  const vistos = new Set();
  for (const item of mesa.pedidosPorConfirmar || []) {
    const clave = item.__origenBar ? `bar-${item.__ordenBarId}` : `cocina-${item.pedido_id}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    grupos.push({
      clave,
      origenBar: !!item.__origenBar,
      id: item.__origenBar ? item.__ordenBarId : item.pedido_id,
      items: (mesa.pedidosPorConfirmar || []).filter(i =>
        item.__origenBar ? i.__ordenBarId === item.__ordenBarId : i.pedido_id === item.pedido_id
      ),
    });
  }

  const confirmarGrupo = async (grupo) => {
    setProcesando(grupo.clave);
    await onConfirmar(grupo);
    setProcesando(null);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" style={{ maxWidth: "480px", maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header modal-header-normal">
          <h4 className="modal-titulo">🔔 Pedidos por confirmar — {mesa.nombre}</h4>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
          {grupos.length === 0 && <p className="texto-secundario">No hay pedidos pendientes.</p>}
          {grupos.map(grupo => (
            <div key={grupo.clave} className="confirmar-grupo">
              <span className={`confirmar-grupo-etiqueta ${grupo.origenBar ? "bar" : "cocina"}`}>
                {grupo.origenBar ? "🍹 Barra" : "🍽️ Cocina"}
              </span>
              {grupo.items.map((item, i) => (
                <p key={i} className="confirmar-item">
                  <span className="confirmar-item-cant">{item.cantidad}×</span>
                  <span>{item.nombre}</span>
                  {item.observacion && <span className="confirmar-item-obs">— {item.observacion}</span>}
                </p>
              ))}
              <button
                className="btn-primario"
                disabled={procesando === grupo.clave}
                onClick={() => confirmarGrupo(grupo)}
              >
                {procesando === grupo.clave ? "Confirmando..." : "Confirmar y enviar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

const Mesas = ({
  mesas,
  cajaAbierta,
  onCrearMesa,
  onVerQR,
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
  const [mesaConfirmando, setMesaConfirmando]   = useState(null);
  const [formMesa,         setFormMesa]          = useState(formInicial());
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

  // Actualiza un solo campo del formulario
  const setCampo = (campo, valor) =>
    setFormMesa(prev => ({ ...prev, [campo]: valor }));

  // Abre el formulario con valores limpios (zona = la que esté filtrada)
  const abrirFormCrear = () => {
    setFormMesa(formInicial(zonaFiltro));
    setModoCrear(true);
  };

  const cerrarFormCrear = () => {
    setModoCrear(false);
    setFormMesa(formInicial(zonaFiltro));
  };

  const handleCrear = () => {
    const nombre = formMesa.nombre.trim();
    if (!nombre) return;

    // Normaliza lo escrito en el formulario antes de enviarlo
    const datos = {
      zona_id:   formMesa.zona_id === "" ? null : Number(formMesa.zona_id),
      capacidad: Math.min(Math.max(parseInt(formMesa.capacidad, 10) || 4, 1), 50),
      forma:     formMesa.forma || "cuadrada",
      pos_x:     Math.max(0, parseInt(formMesa.pos_x, 10) || 0),
      pos_y:     Math.max(0, parseInt(formMesa.pos_y, 10) || 0),
    };

    // (nombre, zona_id) igual que antes + tercer argumento con el resto de campos
    onCrearMesa(nombre, datos.zona_id, datos);
    cerrarFormCrear();
  };

  // ── Detalle de mesa ────────────────────────────────────────────
  if (mesaSeleccionada) {
    const mesaActual = mesas.find(m => m.id === mesaSeleccionada.id) || mesaSeleccionada;
    return (
      <DetalleMesa
        mesa={mesaActual}
        mesas={mesas}                          // ← para el modal de mover
        cajaAbierta={cajaAbierta}
        onModificarItem={onModificarItem}
        onEliminarItem={onEliminarItem}
        onMoverItems={onMoverItems}
        // ✅ CAMBIO: se agrega `resumen` como argumento adicional.
        onPagoTotal={async (metodo, resumen) => {
          await onPagoTotal(mesaActual, metodo, resumen);
          setMesaSeleccionada(null);
        }}
        onPagoParcial={async (items, metodo, resumen) => {
          await onPagoParcial(mesaActual, items, metodo, resumen);
          const mesaPost = mesas.find(m => m.id === mesaActual.id);
          if (mesaPost && mesaPost.pedido.length === 0) setMesaSeleccionada(null);
        }}
        onVolver={() => setMesaSeleccionada(null)}
      />
    );
  }

  const handleConfirmarGrupo = async (grupo) => {
    try {
      if (grupo.origenBar) {
        await barService.actualizarEstado(grupo.id, "pendiente");
      } else {
        await pedidoService.confirmarCocina(grupo.id);
      }
      await onRecargar();
      toast?.exito?.("Pedido confirmado y enviado.");
    } catch (err) {
      toast?.error?.(err.message || "No se pudo confirmar el pedido.");
    }
  };

  const mesasFiltradas = zonaFiltro
    ? mesas.filter(m => m.zona_id === zonaFiltro)
    : mesas;

  return (
    <div className="seccion-container">
      {mesaConfirmando && (
        <ModalConfirmarPedidos
          mesa={mesaConfirmando}
          onConfirmar={handleConfirmarGrupo}
          onCerrar={() => setMesaConfirmando(null)}
        />
      )}

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
            {/* El botón se oculta mientras el formulario está abierto */}
            {!modoCrear && (
              <button className="btn-secundario" onClick={abrirFormCrear}>
                + Nueva mesa
              </button>
            )}

            <button
              className={`btn-ghost ${modoEliminar ? "btn-ghost-activo" : ""}`}
              onClick={() => setModoEliminar(!modoEliminar)}
            >
              {modoEliminar ? "Listo" : "✕ Eliminar mesa"}
            </button>
          </div>

          {/* ══ FORMULARIO COMPLETO DE NUEVA MESA ═════════════════ */}
          {modoCrear && (
            <div className="admin-card" style={{ marginBottom: "1rem" }}>
              <h3 className="subtitulo">Nueva mesa</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "0.75rem 1rem",
                  marginTop: "0.5rem",
                }}
              >
                {/* Nombre (ocupa toda la fila) */}
                <div className="campo-grupo" style={{ gridColumn: "1 / -1" }}>
                  <label className="campo-label">Nombre de la mesa *</label>
                  <input
                    className="campo-input"
                    placeholder="Ej: Mesa 4, Mesa Bar, Terraza 2"
                    value={formMesa.nombre}
                    onChange={e => setCampo("nombre", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCrear()}
                    maxLength={60}
                    autoFocus
                  />
                </div>

                {/* Zona: lista real de zonas del restaurante */}
                <div className="campo-grupo">
                  <label className="campo-label">Zona</label>
                  <select
                    className="campo-input"
                    value={formMesa.zona_id}
                    onChange={e => setCampo("zona_id", e.target.value)}
                  >
                    <option value="">Sin zona</option>
                    {zonas.map(z => (
                      <option key={z.id} value={z.id}>{z.nombre}</option>
                    ))}
                  </select>
                  {zonas.length === 0 && (
                    <p className="texto-muted" style={{ fontSize: "0.72rem", marginTop: "0.25rem" }}>
                      Aún no hay zonas creadas.
                    </p>
                  )}
                </div>

                {/* Capacidad */}
                <div className="campo-grupo">
                  <label className="campo-label">Capacidad (personas)</label>
                  <input
                    className="campo-input"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={formMesa.capacidad}
                    onChange={e => setCampo("capacidad", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCrear()}
                  />
                </div>

                {/* Forma */}
                <div className="campo-grupo">
                  <label className="campo-label">Forma</label>
                  <select
                    className="campo-input"
                    value={formMesa.forma}
                    onChange={e => setCampo("forma", e.target.value)}
                  >
                    {FORMAS_MESA.map(f => (
                      <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Posición inicial en el plano (opcional, plegable) */}
              <details style={{ marginTop: "0.75rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                  Posición en el plano (opcional)
                </summary>
                <p className="texto-muted" style={{ fontSize: "0.75rem", margin: "0.4rem 0" }}>
                  Es donde aparecerá la mesa en la vista Plano. Después puedes arrastrarla.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 160px))",
                    gap: "0.75rem",
                  }}
                >
                  <div className="campo-grupo">
                    <label className="campo-label">Posición X</label>
                    <input
                      className="campo-input"
                      type="number"
                      min="0"
                      step="1"
                      value={formMesa.pos_x}
                      onChange={e => setCampo("pos_x", e.target.value)}
                    />
                  </div>
                  <div className="campo-grupo">
                    <label className="campo-label">Posición Y</label>
                    <input
                      className="campo-input"
                      type="number"
                      min="0"
                      step="1"
                      value={formMesa.pos_y}
                      onChange={e => setCampo("pos_y", e.target.value)}
                    />
                  </div>
                </div>
              </details>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  className="btn-primario"
                  onClick={handleCrear}
                  disabled={!formMesa.nombre.trim()}
                >
                  Crear mesa
                </button>
                <button className="btn-ghost" onClick={cerrarFormCrear}>Cancelar</button>
              </div>
            </div>
          )}

          <div className="mesas-grid">
            {mesasFiltradas.map(mesa => (
              <div
                key={mesa.id}
                className={`mesa-card ${mesa.ocupada ? "ocupada" : "libre"} ${modoEliminar ? "modo-eliminar" : ""} ${mesa.pedidosPorConfirmar?.length > 0 ? "tiene-pendientes" : ""}`}
                onClick={() => !modoEliminar && setMesaSeleccionada(mesa)}
              >
                {mesa.pedidosPorConfirmar?.length > 0 && (
                  <button
                    className="badge-pendientes"
                    onClick={e => { e.stopPropagation(); setMesaConfirmando(mesa); }}
                  >
                    <span className="badge-pendientes-dot" />
                    {mesa.pedidosPorConfirmar.length}
                  </button>
                )}

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
                                {!modoEliminar && (
                  <button
                    className="btn-ghost"
                    style={{ marginTop: "0.4rem", fontSize: "0.7rem" }}
                    onClick={e => { e.stopPropagation(); onVerQR(mesa); }}
                  >
                    📱 Ver QR
                  </button>
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