// frontend/src/components/admin/Quejas.jsx
// Panel de quejas recibidas desde el menú del restaurante

import { useState, useEffect, useCallback } from "react";
import { quejaService } from "../../services/quejaService";

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(valor);
  if (isNaN(d)) return valor;
  return d.toLocaleString("es-CO", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
};

const ESTADOS = ["pendiente", "revisada", "resuelta"];

const COLOR_ESTADO = {
  pendiente: "chip-rojo",
  revisada:  "chip-amber",
  resuelta:  "chip-verde",
};

const ICONO_ESTADO = {
  pendiente: "🔴",
  revisada:  "🟡",
  resuelta:  "🟢",
};

const Quejas = ({ toast }) => {
  const [quejas,       setQuejas]       = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [filtro,       setFiltro]       = useState("todas");
  const [actualizando, setActualizando] = useState(null); // id de la queja que se está actualizando

  const cargar = useCallback(async () => {
    try {
      const data = await quejaService.getAll();
      // La API devuelve array directamente o { quejas: [] }
      setQuejas(Array.isArray(data) ? data : data.quejas || []);
    } catch (err) {
      if (toast) toast.error("Error al cargar quejas: " + err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Refrescar cada 30 segundos por si llegan nuevas quejas
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [cargar]);

  const handleCambiarEstado = async (queja, nuevoEstado) => {
    if (queja.estado === nuevoEstado) return;
    setActualizando(queja.id);
    try {
      await quejaService.updateEstado(queja.id, nuevoEstado);
      setQuejas(prev =>
        prev.map(q => q.id === queja.id ? { ...q, estado: nuevoEstado } : q)
      );
      if (toast) toast.exito(`Queja marcada como "${nuevoEstado}"`);
    } catch (err) {
      if (toast) toast.error("Error al actualizar estado.");
    } finally {
      setActualizando(null);
    }
  };

  // Filtrar quejas
  const quejasFiltradas = filtro === "todas"
    ? quejas
    : quejas.filter(q => q.estado === filtro);

  // Conteos para badges
  const conteos = {
    todas:    quejas.length,
    pendiente: quejas.filter(q => q.estado === "pendiente").length,
    revisada:  quejas.filter(q => q.estado === "revisada").length,
    resuelta:  quejas.filter(q => q.estado === "resuelta").length,
  };

  if (cargando) {
    return (
      <div className="seccion-container">
        <div className="seccion-header">
          <h2 className="seccion-titulo">💬 Quejas y comentarios</h2>
        </div>
        <p className="texto-secundario">Cargando quejas...</p>
      </div>
    );
  }

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">💬 Quejas y comentarios</h2>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {conteos.pendiente > 0 && (
            <span className="chip chip-rojo">
              {conteos.pendiente} pendiente{conteos.pendiente > 1 ? "s" : ""}
            </span>
          )}
          <button
            className="btn-ghost"
            style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
            onClick={cargar}
            title="Actualizar"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* ── FILTROS ── */}
      <div className="tab-selector" style={{ marginBottom: "1rem", width: "fit-content" }}>
        {[
          { key: "todas",    label: `Todas (${conteos.todas})` },
          { key: "pendiente",label: `🔴 Pendientes (${conteos.pendiente})` },
          { key: "revisada", label: `🟡 Revisadas (${conteos.revisada})` },
          { key: "resuelta", label: `🟢 Resueltas (${conteos.resuelta})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${filtro === key ? "activo" : ""}`}
            onClick={() => setFiltro(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── LISTA DE QUEJAS ── */}
      {quejasFiltradas.length === 0 ? (
        <div className="estado-vacio">
          <p className="texto-secundario">
            {filtro === "todas"
              ? "No hay quejas registradas todavía."
              : `No hay quejas con estado "${filtro}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {quejasFiltradas.map((queja) => (
            <div
              key={queja.id}
              className="admin-card"
              style={{
                padding: "1rem 1.25rem",
                borderLeft: `3px solid ${
                  queja.estado === "pendiente" ? "var(--red)" :
                  queja.estado === "revisada"  ? "var(--amber)" :
                  "var(--green)"
                }`,
                opacity: queja.estado === "resuelta" ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>

                {/* Info de la queja */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span className={`chip ${COLOR_ESTADO[queja.estado] || "chip-neutro"}`}>
                      {ICONO_ESTADO[queja.estado]} {queja.estado}
                    </span>
                    {queja.mesa && (
                      <span className="chip chip-neutro">
                        🍽️ Mesa {queja.mesa}
                      </span>
                    )}
                    <span className="texto-muted" style={{ fontSize: "0.72rem", fontFamily: "'DM Mono', monospace" }}>
                      {formatearFecha(queja.fecha || queja.creado_en)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: "0.9rem",
                    color: "var(--text-1)",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {queja.mensaje}
                  </p>
                </div>

                {/* Selector de estado */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexShrink: 0 }}>
                  {ESTADOS.filter(e => e !== queja.estado).map(estado => (
                    <button
                      key={estado}
                      onClick={() => handleCambiarEstado(queja, estado)}
                      disabled={actualizando === queja.id}
                      style={{
                        padding: "0.3rem 0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "var(--r-sm)",
                        border: `1px solid var(--border-light)`,
                        background: "transparent",
                        color: "var(--text-2)",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                        opacity: actualizando === queja.id ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = "var(--bg-hover)";
                        e.target.style.color = "var(--text-1)";
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "var(--text-2)";
                      }}
                    >
                      {actualizando === queja.id ? "..." : `Marcar ${estado}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quejas;