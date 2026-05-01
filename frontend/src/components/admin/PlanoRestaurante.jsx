// frontend/src/components/admin/PlanoRestaurante.jsx
// Vista de plano del restaurante con drag-and-drop nativo del navegador
// Sin dependencias externas — funciona con HTML5 Drag & Drop API

import { useState, useRef, useCallback, useEffect } from "react";
import { mesaService } from "../../services/mesaService";
import { zonaService  } from "../../services/zonaService";

// ── Tamaño de cada mesa en el plano ──────────────────────────────
const MESA_W  = 90;
const MESA_H  = 70;
const CANVAS_W = 760;
const CANVAS_H = 500;

// ── Colores por estado ────────────────────────────────────────────
const colorEstado = (mesa) =>
  mesa.ocupada ? "var(--amber)" : "var(--green)";

// ── Icono de forma ────────────────────────────────────────────────
const FormaIcono = ({ forma, color }) =>
  forma === "redonda"
    ? <circle cx="45" cy="35" r="28" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
    : <rect x="5" y="5" width="80" height="60" rx="8" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />;

// ── Mesa visual en el plano ───────────────────────────────────────
const MesaPlano = ({ mesa, modoEdicion, onDrag, onClick, seleccionada }) => {
  const dragStart = useRef({ x: 0, y: 0 });
  const color = colorEstado(mesa);

  const handleMouseDown = (e) => {
    if (!modoEdicion) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: mesa.pos_x, oy: mesa.pos_y };

    const onMove = (ev) => {
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      const nx = Math.max(0, Math.min(CANVAS_W - MESA_W, dragStart.current.ox + dx));
      const ny = Math.max(0, Math.min(CANVAS_H - MESA_H, dragStart.current.oy + dy));
      onDrag(mesa.id, Math.round(nx), Math.round(ny));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <g
      transform={`translate(${mesa.pos_x}, ${mesa.pos_y})`}
      style={{ cursor: modoEdicion ? "grab" : "pointer" }}
      onMouseDown={handleMouseDown}
      onClick={() => !modoEdicion && onClick(mesa)}
    >
      <svg width={MESA_W} height={MESA_H} overflow="visible">
        <FormaIcono forma={mesa.forma || "cuadrada"} color={color} />

        {/* Borde de selección */}
        {seleccionada && (
          mesa.forma === "redonda"
            ? <circle cx="45" cy="35" r="30" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,3" />
            : <rect x="3" y="3" width="84" height="64" rx="9" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,3" />
        )}

        {/* Nombre */}
        <text x="45" y="28" textAnchor="middle" fill="var(--text-1)"
          fontSize="11" fontWeight="600" fontFamily="DM Sans, sans-serif">
          {mesa.nombre}
        </text>

        {/* Estado */}
        <text x="45" y="44" textAnchor="middle" fill={color}
          fontSize="9" fontFamily="DM Mono, monospace">
          {mesa.ocupada ? `$${(mesa.total || 0).toLocaleString("es-CO")}` : "Libre"}
        </text>

        {/* Capacidad */}
        <text x="45" y="58" textAnchor="middle" fill="var(--text-2)"
          fontSize="8" fontFamily="DM Mono, monospace">
          👥 {mesa.capacidad || 4}
        </text>
      </svg>
    </g>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
const PlanoRestaurante = ({ mesas, zonas, onMesaClick, onRecargar, toast }) => {
  const [zonaActiva,   setZonaActiva]   = useState(null);
  const [modoEdicion,  setModoEdicion]  = useState(false);
  const [posiciones,   setPosiciones]   = useState({}); // { id: {pos_x, pos_y} }
  const [guardando,    setGuardando]    = useState(false);
  const [mesaConfig,   setMesaConfig]   = useState(null); // mesa en edición
  const [modalZona,    setModalZona]    = useState(false);
  const [nuevaZona,    setNuevaZona]    = useState({ nombre: "", color: "#f59e0b" });
  const [cambiosPend,  setCambiosPend]  = useState(false);
  const svgRef = useRef(null);

  // Sincronizar posiciones locales cuando llegan mesas nuevas
  useEffect(() => {
    const init = {};
    mesas.forEach(m => { init[m.id] = { pos_x: m.pos_x || 0, pos_y: m.pos_y || 0 }; });
    setPosiciones(init);
    setCambiosPend(false);
  }, [mesas]);

  // Mesas filtradas por zona activa
  const mesasFiltradas = zonaActiva
    ? mesas.filter(m => m.zona_id === zonaActiva)
    : mesas;

  // Mesas con posiciones locales aplicadas
  const mesasConPos = mesasFiltradas.map(m => ({
    ...m,
    pos_x: posiciones[m.id]?.pos_x ?? m.pos_x ?? 0,
    pos_y: posiciones[m.id]?.pos_y ?? m.pos_y ?? 0,
  }));

  // Actualizar posición local (durante el drag)
  const handleDrag = useCallback((id, pos_x, pos_y) => {
    setPosiciones(prev => ({ ...prev, [id]: { pos_x, pos_y } }));
    setCambiosPend(true);
  }, []);

  // Guardar todas las posiciones en el backend
  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = Object.entries(posiciones).map(([id, pos]) => ({
        id: parseInt(id), ...pos,
      }));
      await mesaService.savePosiciones(payload);
      setCambiosPend(false);
      if (toast) toast.exito("Plano guardado correctamente");
      onRecargar();
    } catch (err) {
      if (toast) toast.error("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Guardar config de una mesa (zona, capacidad, forma, nombre)
  const handleGuardarConfig = async () => {
    if (!mesaConfig) return;
    try {
      await mesaService.updateConfig(mesaConfig.id, {
        zona_id:   mesaConfig.zona_id,
        capacidad: mesaConfig.capacidad,
        forma:     mesaConfig.forma,
        nombre:    mesaConfig.nombre,
      });
      if (toast) toast.exito("Mesa actualizada");
      setMesaConfig(null);
      onRecargar();
    } catch (err) {
      if (toast) toast.error("Error al actualizar: " + err.message);
    }
  };

  // Crear nueva zona
  const handleCrearZona = async () => {
    if (!nuevaZona.nombre.trim()) return;
    try {
      await zonaService.crear(nuevaZona);
      if (toast) toast.exito(`Zona "${nuevaZona.nombre}" creada`);
      setModalZona(false);
      setNuevaZona({ nombre: "", color: "#f59e0b" });
      onRecargar();
    } catch (err) {
      if (toast) toast.error("Error al crear zona: " + err.message);
    }
  };

  // Eliminar zona
  const handleEliminarZona = async (id) => {
    try {
      await zonaService.eliminar(id);
      if (zonaActiva === id) setZonaActiva(null);
      if (toast) toast.advertencia("Zona eliminada");
      onRecargar();
    } catch (err) {
      if (toast) toast.error("Error al eliminar zona.");
    }
  };

  const COLORES_PRESET = [
    "#f59e0b","#22c55e","#a855f7","#3b82f6",
    "#ef4444","#f97316","#06b6d4","#ec4899",
  ];

  return (
    <div className="plano-container">

      {/* ── TOOLBAR ── */}
      <div className="plano-toolbar">
        <div className="plano-zonas-tabs">
          <button
            className={`zona-tab ${zonaActiva === null ? "activa" : ""}`}
            onClick={() => setZonaActiva(null)}
          >
            Todas
          </button>
          {zonas.map(z => (
            <div key={z.id} className="zona-tab-wrapper">
              <button
                className={`zona-tab ${zonaActiva === z.id ? "activa" : ""}`}
                style={{ borderColor: zonaActiva === z.id ? z.color : "transparent" }}
                onClick={() => setZonaActiva(z.id === zonaActiva ? null : z.id)}
              >
                <span className="zona-dot" style={{ background: z.color }} />
                {z.nombre}
              </button>
              {modoEdicion && (
                <button
                  className="zona-tab-del"
                  onClick={() => handleEliminarZona(z.id)}
                  title="Eliminar zona"
                >✕</button>
              )}
            </div>
          ))}
          {modoEdicion && (
            <button className="zona-tab zona-add" onClick={() => setModalZona(true)}>
              + Zona
            </button>
          )}
        </div>

        <div className="plano-acciones">
          {cambiosPend && modoEdicion && (
            <button
              className="btn-primario"
              style={{ fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "💾 Guardar plano"}
            </button>
          )}
          <button
            className={modoEdicion ? "btn-peligro" : "btn-secundario"}
            style={{ fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
            onClick={() => { setModoEdicion(!modoEdicion); setCambiosPend(false); }}
          >
            {modoEdicion ? "✓ Salir de edición" : "✏️ Editar plano"}
          </button>
        </div>
      </div>

      {modoEdicion && (
        <div className="plano-hint">
          💡 Arrastra las mesas para reposicionarlas · Haz clic en una mesa para editar sus propiedades
        </div>
      )}

      {/* ── CANVAS SVG ── */}
      <div className="plano-canvas-wrapper">
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="plano-svg"
          style={{ userSelect: "none" }}
        >
          {/* Grid de fondo */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" opacity="0.5" />
          <rect width={CANVAS_W} height={CANVAS_H} fill="none" stroke="var(--border-light)" strokeWidth="1" />

          {/* Etiquetas de zonas en el canvas */}
          {zonas.map(z => {
            const mesasZona = mesasConPos.filter(m => m.zona_id === z.id);
            if (mesasZona.length === 0) return null;
            const minX = Math.min(...mesasZona.map(m => m.pos_x));
            const minY = Math.min(...mesasZona.map(m => m.pos_y));
            return (
              <text key={z.id} x={minX} y={Math.max(0, minY - 6)}
                fill={z.color} fontSize="10" fontWeight="700"
                fontFamily="DM Sans, sans-serif" opacity="0.7">
                {z.nombre}
              </text>
            );
          })}

          {/* Mesas */}
          {mesasConPos.map(mesa => (
            <MesaPlano
              key={mesa.id}
              mesa={mesa}
              modoEdicion={modoEdicion}
              onDrag={handleDrag}
              onClick={modoEdicion
                ? () => setMesaConfig({ ...mesa })
                : onMesaClick
              }
              seleccionada={mesaConfig?.id === mesa.id}
            />
          ))}

          {mesasConPos.length === 0 && (
            <text x={CANVAS_W / 2} y={CANVAS_H / 2}
              textAnchor="middle" fill="var(--text-3)"
              fontSize="14" fontFamily="DM Sans, sans-serif">
              No hay mesas en esta zona
            </text>
          )}
        </svg>
      </div>

      {/* ── MODAL: EDITAR MESA ── */}
      {mesaConfig && (
        <div className="modal-overlay" onClick={() => setMesaConfig(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal">
              <span className="modal-titulo">Configurar mesa</span>
              <button className="modal-cerrar" onClick={() => setMesaConfig(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="campo-grupo">
                <label className="campo-label">Nombre</label>
                <input className="campo-input" value={mesaConfig.nombre}
                  onChange={e => setMesaConfig({ ...mesaConfig, nombre: e.target.value })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Zona</label>
                <select className="campo-input" value={mesaConfig.zona_id || ""}
                  onChange={e => setMesaConfig({ ...mesaConfig, zona_id: e.target.value || null })}>
                  <option value="">Sin zona</option>
                  {zonas.map(z => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Capacidad (personas)</label>
                <input className="campo-input" type="number" min="1" max="20"
                  value={mesaConfig.capacidad || 4}
                  onChange={e => setMesaConfig({ ...mesaConfig, capacidad: parseInt(e.target.value) })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Forma</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {["cuadrada", "redonda"].map(f => (
                    <button key={f} type="button"
                      className={`btn-rol ${mesaConfig.forma === f ? "activo" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setMesaConfig({ ...mesaConfig, forma: f })}>
                      {f === "cuadrada" ? "⬛ Cuadrada" : "⭕ Redonda"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setMesaConfig(null)}>Cancelar</button>
              <button className="btn-primario" onClick={handleGuardarConfig}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVA ZONA ── */}
      {modalZona && (
        <div className="modal-overlay" onClick={() => setModalZona(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal">
              <span className="modal-titulo">Nueva zona</span>
              <button className="modal-cerrar" onClick={() => setModalZona(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="campo-grupo">
                <label className="campo-label">Nombre de la zona</label>
                <input className="campo-input" autoFocus
                  placeholder="Ej: Terraza, VIP, Piso 2..."
                  value={nuevaZona.nombre}
                  onChange={e => setNuevaZona({ ...nuevaZona, nombre: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleCrearZona()}
                />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Color identificador</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {COLORES_PRESET.map(c => (
                    <button key={c} type="button"
                      onClick={() => setNuevaZona({ ...nuevaZona, color: c })}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: c, border: nuevaZona.color === c ? "3px solid white" : "2px solid transparent",
                        cursor: "pointer", transition: "transform 0.15s",
                        transform: nuevaZona.color === c ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.75rem", borderRadius: "var(--r-sm)",
                background: "var(--bg)", border: "1px solid var(--border)", marginTop: "0.5rem",
              }}>
                <span className="zona-dot" style={{ background: nuevaZona.color, width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-1)" }}>
                  {nuevaZona.nombre || "Vista previa de la zona"}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setModalZona(false)}>Cancelar</button>
              <button className="btn-primario" onClick={handleCrearZona}
                disabled={!nuevaZona.nombre.trim()}>
                Crear zona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanoRestaurante;