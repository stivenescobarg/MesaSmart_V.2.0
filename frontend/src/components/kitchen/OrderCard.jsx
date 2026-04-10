import { useState, useEffect } from "react";
import "./OrderCard.css";

// Configuración visual por estado (usa variables CSS del tema)
const ESTADO_CONFIG = {
  pendiente: {
    label:         "Pendiente",
    siguiente:     "en_preparacion",
    siguienteLabel: "Iniciar preparación",
    colorVar:      "--kd-pending-color",
    bgVar:         "--kd-pending-bg",
    borderVar:     "--kd-pending-border",
    dotClass:      "dot-pending",
  },
  en_preparacion: {
    label:         "En preparación",
    siguiente:     "listo",
    siguienteLabel: "Marcar como listo",
    colorVar:      "--kd-prep-color",
    bgVar:         "--kd-prep-bg",
    borderVar:     "--kd-prep-border",
    dotClass:      "dot-prep",
  },
  listo: {
    label:         "Listo",
    siguiente:     null,
    siguienteLabel: null,
    colorVar:      "--kd-ready-color",
    bgVar:         "--kd-ready-bg",
    borderVar:     "--kd-ready-border",
    dotClass:      "dot-ready",
  },
};

function useTiempoTranscurrido(horaISO) {
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    const calcular = () => {
      const diff = Math.floor((Date.now() - new Date(horaISO).getTime()) / 60000);
      setMinutos(Math.max(0, diff));
    };
    calcular();
    const t = setInterval(calcular, 30000);
    return () => clearInterval(t);
  }, [horaISO]);

  return minutos;
}

// Separar items por categoría
function agruparPorCategoria(items) {
  const comida  = items.filter(i => i.categoria === "comida");
  const bebida  = items.filter(i => i.categoria === "bebida");
  const otros   = items.filter(i => i.categoria !== "comida" && i.categoria !== "bebida");
  return { comida, bebida, otros };
}

export default function OrderCard({ order, onUpdateStatus }) {
  const { id, mesa, hora, estado, items = [] } = order;
  const config  = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  const minutos = useTiempoTranscurrido(hora);
  const [loading, setLoading] = useState(false);

  const urgente = minutos >= 10 && estado !== "listo";
  const { comida, bebida, otros } = agruparPorCategoria(items);

  const handleUpdate = async () => {
    if (!config.siguiente || loading) return;
    setLoading(true);
    await onUpdateStatus(id, config.siguiente);
    setLoading(false);
  };

  return (
    <div className={`oc-card${urgente ? " urgente" : ""}${estado === "listo" ? " listo" : ""}`}
      style={{
        "--card-color":  `var(${config.colorVar})`,
        "--card-bg":     `var(${config.bgVar})`,
        "--card-border": `var(${config.borderVar})`,
      }}
    >
      {/* ── Header de la tarjeta ── */}
      <div className="oc-header">
        <div className="oc-header-left">
          <span className={`oc-dot ${config.dotClass}`} />
          <span className="oc-mesa">Mesa {mesa}</span>
          <span className="oc-estado-badge">{config.label}</span>
        </div>
        <div className={`oc-timer${urgente ? " urgente" : ""}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{minutos === 0 ? "Ahora" : `${minutos}m`}</span>
          {urgente && <span className="oc-demorado">DEMORADO</span>}
        </div>
      </div>

      {/* ── Items agrupados por categoría ── */}
      <div className="oc-items">
        {comida.length > 0 && (
          <div className="oc-categoria">
            <div className="oc-categoria-header oc-categoria-food">
              <span>🍽</span>
              <span>Comida</span>
            </div>
            {comida.map((item, i) => (
              <ItemRow key={`f-${i}`} item={item} />
            ))}
          </div>
        )}

        {bebida.length > 0 && (
          <div className="oc-categoria">
            <div className="oc-categoria-header oc-categoria-drink">
              <span>🥤</span>
              <span>Bebidas</span>
            </div>
            {bebida.map((item, i) => (
              <ItemRow key={`b-${i}`} item={item} />
            ))}
          </div>
        )}

        {otros.length > 0 && (
          <div className="oc-categoria">
            <div className="oc-categoria-header">
              <span>📦</span>
              <span>Otros</span>
            </div>
            {otros.map((item, i) => (
              <ItemRow key={`o-${i}`} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Botón de avance de estado ── */}
      {config.siguiente && (
        <div className="oc-footer">
          <button
            className={`oc-btn${loading ? " loading" : ""}`}
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Guardando..." : config.siguienteLabel}
          </button>
        </div>
      )}

      {/* ── Banner "Listo para servir" ── */}
      {estado === "listo" && (
        <div className="oc-listo-banner">
          ✓ LISTO PARA SERVIR
        </div>
      )}
    </div>
  );
}

function ItemRow({ item }) {
  return (
    <div className="oc-item">
      <span className="oc-item-qty">{item.cantidad}</span>
      <div className="oc-item-info">
        <p className="oc-item-nombre">{item.nombre}</p>
        {item.notas && (
          <p className="oc-item-notas">⚠ {item.notas}</p>
        )}
      </div>
    </div>
  );
}
