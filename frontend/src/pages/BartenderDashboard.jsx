import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SesionesContent from "./SesionesTab";
import "../components/bar/utils/styles/bartender.tokens.css";
import "../components/bar/utils/styles/bartender.header.css";
import "../components/bar/utils/styles/bartender.cards.css";
import "../components/bar/utils/styles/bartender.inventario.css";
import "../components/bar/utils/styles/bartender.historial.css";
import "../components/bar/utils/styles/bartender.modals.css";
const API = "http://localhost:3001";

// ── Utilidades de formato ────────────────────────────────────
const fmtFecha = iso =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) + " " +
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const tiempoEla = iso => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

const fmtCountdown = secs => {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtDuracion = min => {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

const pctStock = (actual, minimo) =>
  Math.min(100, Math.round((Number(actual) / Math.max(Number(minimo) * 1.5, 1)) * 100));

// ── Config de estados ────────────────────────────────────────
const ESTADO_CFG = {
  pendiente:       { label: "Nueva",      cls: "bd-pill-new"    },
  en_preparacion:  { label: "Preparando", cls: "bd-pill-prep"   },
  pausado:         { label: "Pausada",    cls: "bd-pill-paused" },
  listo:           { label: "Lista",      cls: "bd-pill-done"   },
};

// ── Chips predefinidos de modificaciones ─────────────────────
const MODS_PREDEFINIDAS = [
  "Sin hielo", "Extra hielo", "Sin azúcar", "Doble",
  "Con limón", "Sin limón", "Fuerte", "Suave",
];

// ═══════════════════════════════════════════════════════════════
// GENERADOR DE PDF (sin dependencias externas)
// ═══════════════════════════════════════════════════════════════
const generarPDFTurno = (resumen) => {
  const {
    bartender, inicio, fin, duracion_min,
    total_bebidas, total_ordenes,
    detalle_bebidas = [], hora_pico, mesas_top = [],
  } = resumen;

  const fmt = iso => new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const barMaximo = detalle_bebidas[0]?.cantidad || 1;
  const barWidth  = (cant) => Math.round((cant / barMaximo) * 180);

  const filasBebidas = detalle_bebidas.map((b, i) => `
    <tr>
      <td style="padding:8px 12px;color:#e2e2e8;font-size:13px;">${i + 1}. ${b.nombre}</td>
      <td style="padding:8px 12px;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <div style="width:${barWidth(b.cantidad)}px;height:8px;background:linear-gradient(90deg,#ef4444,#f97316);border-radius:4px;"></div>
          <span style="color:#ff7a6b;font-weight:700;font-size:13px;">${b.cantidad}</span>
        </div>
      </td>
    </tr>
  `).join("");

  const filasMesas = mesas_top.map(m => `
    <tr>
      <td style="padding:6px 12px;color:#c8c8d8;font-size:13px;">Mesa ${m.mesa}</td>
      <td style="padding:6px 12px;text-align:right;color:#ff7a6b;font-weight:600;font-size:13px;">${m.bebidas} bebidas</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cierre de Turno — ${bartender}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Syne',sans-serif; background:#0d0d14; color:#e2e2e8; padding:40px; min-height:100vh; }
    .page { max-width:680px; margin:0 auto; }
    .header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:36px; padding-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.08); }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-diamond { width:36px;height:36px;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff; }
    .brand-name { font-size:20px; font-weight:800; color:#fff; }
    .brand-sub  { font-size:12px; color:#707088; margin-top:2px; }
    .doc-title  { text-align:right; }
    .doc-titulo { font-size:14px; font-weight:700; color:#a0a0b8; text-transform:uppercase; letter-spacing:.08em; }
    .doc-fecha  { font-size:12px; color:#606075; margin-top:4px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
    .stat-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; text-align:center; }
    .stat-box.accent { background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2); }
    .stat-val { font-size:26px; font-weight:800; color:#f0f0f8; line-height:1; font-family:'IBM Plex Mono',monospace; }
    .stat-box.accent .stat-val { color:#ff6b6b; }
    .stat-lbl { font-size:11px; color:#707088; text-transform:uppercase; letter-spacing:.05em; margin-top:6px; font-weight:600; }
    .info-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
    .info-box { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px 16px; }
    .info-label { font-size:11px; color:#606075; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
    .info-value { font-size:14px; color:#e2e2e8; font-weight:600; }
    .seccion { margin-bottom:28px; }
    .seccion-titulo { font-size:11px; font-weight:700; color:#707088; text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); }
    table { width:100%; border-collapse:collapse; }
    tr:nth-child(even) td { background:rgba(255,255,255,0.02); }
    .hora-pico { display:inline-flex; align-items:center; gap:10px; background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.25); border-radius:10px; padding:12px 20px; }
    .hora-pico-val { font-size:18px; font-weight:800; color:#f97316; font-family:'IBM Plex Mono',monospace; }
    .hora-pico-lbl { font-size:12px; color:#a0a0b8; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; }
    .footer-brand { font-size:12px; color:#404055; }
    .footer-sign { border-top:1px solid rgba(255,255,255,0.1); width:160px; text-align:center; padding-top:8px; font-size:11px; color:#505065; }
    @media print { body { background:#0d0d14 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-diamond">◆</div>
        <div><div class="brand-name">MesaSmart</div><div class="brand-sub">Reporte de cierre de turno</div></div>
      </div>
      <div class="doc-title">
        <div class="doc-titulo">Cierre de Turno</div>
        <div class="doc-fecha">Generado: ${fmt(new Date())}</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-box accent"><div class="stat-val">${total_bebidas}</div><div class="stat-lbl">Bebidas servidas</div></div>
      <div class="stat-box accent"><div class="stat-val">${total_ordenes}</div><div class="stat-lbl">Órdenes completadas</div></div>
      <div class="stat-box"><div class="stat-val">${fmtDuracion(duracion_min)}</div><div class="stat-lbl">Duración turno</div></div>
      <div class="stat-box"><div class="stat-val">${total_ordenes > 0 ? (total_bebidas / total_ordenes).toFixed(1) : "0"}</div><div class="stat-lbl">Beb. por orden</div></div>
    </div>
    <div class="info-row">
      <div class="info-box"><div class="info-label">Bartender</div><div class="info-value">👤 ${bartender}</div></div>
      <div class="info-box"><div class="info-label">Inicio de turno</div><div class="info-value">${fmt(inicio)}</div></div>
      <div class="info-box"><div class="info-label">Cierre de turno</div><div class="info-value">${fmt(fin)}</div></div>
      <div class="info-box"><div class="info-label">Promedio por hora</div><div class="info-value">${duracion_min > 0 ? Math.round(total_bebidas / (duracion_min / 60)) : 0} bebidas/hora</div></div>
    </div>
    ${detalle_bebidas.length > 0 ? `<div class="seccion"><div class="seccion-titulo">🍹 Bebidas más servidas</div><table>${filasBebidas}</table></div>` : ""}
    ${mesas_top.length > 0 ? `<div class="seccion"><div class="seccion-titulo">🪑 Mesas más activas</div><table>${filasMesas}</table></div>` : ""}
    ${hora_pico ? `<div class="seccion"><div class="seccion-titulo">⚡ Hora pico del turno</div><div class="hora-pico"><span style="font-size:20px">🕐</span><div><div class="hora-pico-val">${hora_pico.hora}</div><div class="hora-pico-lbl">${hora_pico.bebidas} bebidas en esa hora</div></div></div></div>` : ""}
    <div class="footer">
      <div class="footer-brand">MesaSmart · Documento generado automáticamente</div>
      <div class="footer-sign">Firma del bartender</div>
    </div>
  </div>
</body>
</html>`;

  const ventana = window.open("", "_blank");
  ventana.document.write(html);
  ventana.document.close();
  setTimeout(() => ventana.print(), 800);
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: ItemRow
// ═══════════════════════════════════════════════════════════════
const ItemRow = ({ item }) => {
  const [open, setOpen] = useState(false);
  const nombre   = typeof item === "object" ? item.nombre   : item.replace(/ x\d+$/, "");
  const cantidad = typeof item === "object" ? item.cantidad : (item.match(/ x(\d+)$/)?.[1] ?? 1);
  const mods     = typeof item === "object" ? (item.adiciones ?? []) : [];
  const nota     = typeof item === "object" ? (item.observacion ?? item.notas ?? "") : "";
  const tipo     = typeof item === "object" ? item.categoria : null;

  return (
    <div className="bd-item" onClick={() => setOpen(o => !o)}>
      <div className="bd-item-row">
        <span className="bd-item-name">{nombre}</span>
        <div className="bd-item-right">
          <span className="bd-item-qty">{cantidad}</span>
          <span className={`bd-item-arrow${open ? " open" : ""}`}>▶</span>
        </div>
      </div>
      {open && (
        <div className="bd-item-sub">
          {tipo && <span className="bd-tag bd-tag-type">{tipo}</span>}
          {mods.map((m, i) => <span key={i} className="bd-tag bd-tag-mod">{m}</span>)}
          {nota && <span className="bd-tag bd-tag-note">📝 {nota}</span>}
          {!tipo && !mods.length && !nota && (
            <span style={{ fontSize: 11, color: "var(--bd-muted)" }}>Sin notas</span>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: OrderCard — con botón "Preparando" añadido
// ═══════════════════════════════════════════════════════════════
const OrderCard = ({ orden, onCompletar, onPausar, onAnclar, onPreparar }) => {
  const cfg      = ESTADO_CFG[orden.estado] ?? ESTADO_CFG.pendiente;
  const total    = orden.items?.reduce((a, i) => a + (typeof i === "object" ? i.cantidad : 1), 0) ?? 0;
  const elapsed  = Date.now() - new Date(orden.creado_en);
  const isUrg    = elapsed > 300000 && orden.estado !== "pausado";
  const isPaused = orden.estado === "pausado";
  const isPrep   = orden.estado === "en_preparacion";
  const isPend   = orden.estado === "pendiente";

  return (
    <div className={`bd-card${orden.anclada ? " pinned" : ""}${isPaused ? " paused" : ""}${isUrg ? " urgent" : ""}`}>
      <div className="bd-card-top">
        <div>
          <div className="bd-mesa-lbl">Mesa</div>
          <div className="bd-mesa-num">{orden.mesa?.replace(/\D/g, "") || "?"}</div>
        </div>
        <div className="bd-card-pills">
          <span className={`bd-pill ${cfg.cls}`}>{cfg.label}</span>
          {orden.anclada && <span className="bd-pill bd-pill-pin">📌 Anclada</span>}
        </div>
      </div>

      <div className="bd-card-body">
        <div className="bd-drink-name">
          {orden.items?.[0]
            ? (typeof orden.items[0] === "object" ? orden.items[0].nombre : orden.items[0].replace(/ x\d+$/, ""))
            : "Sin nombre"}
          {orden.items?.length > 1 && ` +${orden.items.length - 1} más`}
        </div>
        <div className="bd-drink-sub">
          <b>{total}</b> bebida{total !== 1 ? "s" : ""} · hace {tiempoEla(orden.creado_en)}
        </div>
        <div className="bd-items-list">
          {orden.items?.map((item, i) => <ItemRow key={i} item={item} />)}
        </div>
      </div>

      <div className="bd-card-foot">
        <div className={`bd-timer${isUrg ? " urgent" : ""}`}>
          <span className="bd-tdot" />
          {tiempoEla(orden.creado_en)}
        </div>
        <div className="bd-card-btns">
          {isPend && (
            <button className="bd-fb bd-fb-prep" onClick={() => onPreparar(orden.id)}>
              ▶ Preparar
            </button>
          )}
          <button className="bd-fb bd-fb-pin"   onClick={() => onAnclar(orden.id)}>
            {orden.anclada ? "Desanclar" : "Anclar"}
          </button>
          <button className="bd-fb bd-fb-pause" onClick={() => onPausar(orden.id)}>
            {isPaused ? "▶" : "⏸"}
          </button>
          <button className="bd-fb bd-fb-done"  onClick={() => onCompletar(orden)}>
            ✓ Listo
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Nueva Orden — con chips de modificaciones
// ═══════════════════════════════════════════════════════════════
const NuevaOrdenModal = ({ onClose, onAgregar }) => {
  const [form, setForm]   = useState({ mesa: "", bebida: "", cantidad: 1, tipo: "", nota: "" });
  const [chips, setChips] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleChip = (chip) =>
    setChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);

  const submit = () => {
    if (!form.mesa || !form.bebida) return alert("Mesa y bebida son obligatorios");
    onAgregar({
      mesa: `Mesa ${form.mesa}`,
      estado: "pendiente",
      creado_en: new Date().toISOString(),
      anclada: false,
      items: [{
        nombre: form.bebida,
        cantidad: Number(form.cantidad) || 1,
        categoria: form.tipo || "bebida",
        adiciones: chips,
        observacion: form.nota,
      }],
    });
    onClose();
  };

  return (
    <div className="bd-modal-overlay" onClick={onClose}>
      <div className="bd-modal" onClick={e => e.stopPropagation()}>
        <div className="bd-modal-handle" />
        <button className="bd-modal-close" onClick={onClose}>✕</button>
        <h2 className="bd-modal-title">➕ Nueva orden</h2>
        <div className="bd-modal-row2">
          <input className="bd-inp" placeholder="Mesa #" type="number" value={form.mesa}
            onChange={e => set("mesa", e.target.value)} />
          <input className="bd-inp" placeholder="Cantidad" type="number" value={form.cantidad}
            onChange={e => set("cantidad", e.target.value)} />
        </div>
        <input className="bd-inp" placeholder="Bebida principal *" value={form.bebida}
          onChange={e => set("bebida", e.target.value)} />
        <input className="bd-inp" placeholder="Tipo (Whisky, Ron, Gin…)" value={form.tipo}
          onChange={e => set("tipo", e.target.value)} />
        <div className="bd-mod-chip-label">Modificaciones rápidas</div>
        <div className="bd-mods-chips">
          {MODS_PREDEFINIDAS.map(m => (
            <button key={m} className={`bd-mod-chip${chips.includes(m) ? " selected" : ""}`}
              onClick={() => toggleChip(m)}>{m}</button>
          ))}
        </div>
        <input className="bd-inp" placeholder="Nota especial" value={form.nota}
          onChange={e => set("nota", e.target.value)} />
        <div className="bd-modal-btns">
          <button className="bd-mbt bd-mbt-cancel" onClick={onClose}>Cancelar</button>
          <button className="bd-mbt bd-mbt-ok"     onClick={submit}>Agregar orden</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Cierre de turno
// ═══════════════════════════════════════════════════════════════
const CierreTurnoModal = ({ onConfirmar, onCancelar, cargando }) => (
  <div className="bd-modal-overlay" onClick={onCancelar}>
    <div className="bd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
      <div className="bd-modal-handle" />
      <h2 className="bd-modal-title">⏹ Cerrar turno</h2>
      <p className="bd-modal-desc">
        Se guardará el resumen del turno en el historial y se generará un PDF
        con las estadísticas completas. ¿Confirmas el cierre?
      </p>
      <div className="bd-modal-btns">
        <button className="bd-mbt bd-mbt-cancel" onClick={onCancelar} disabled={cargando}>Cancelar</button>
        <button className="bd-mbt bd-mbt-ok"     onClick={onConfirmar} disabled={cargando}>
          {cargando ? "Cerrando…" : "Cerrar y generar PDF"}
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MODAL: Ingreso / Ajuste de stock
// ═══════════════════════════════════════════════════════════════
const StockModal = ({ producto, modo, onClose, onGuardar }) => {
  const [valor, setValor] = useState("");
  const isIngreso = modo === "ingreso";

  const submit = () => {
    const num = Number(valor);
    if (!num || num <= 0) return alert("Ingresa un valor válido");
    onGuardar(producto.id, isIngreso
      ? { stock_actual: Number(producto.stock_actual) + num }
      : { stock_actual: num }
    );
    onClose();
  };

  return (
    <div className="bd-modal-overlay" onClick={onClose}>
      <div className="bd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
        <div className="bd-modal-handle" />
        <button className="bd-modal-close" onClick={onClose}>✕</button>
        <h2 className="bd-modal-title">
          {isIngreso ? "📦 Ingreso de stock" : "✏️ Ajustar stock"}
        </h2>
        <p className="bd-modal-desc" style={{ marginTop: 4, marginBottom: 14 }}>
          <strong style={{ color: "var(--bd-text)" }}>{producto.nombre}</strong>
          <br />
          {isIngreso
            ? `Stock actual: ${producto.stock_actual} ${producto.unidad} · Ingresa la cantidad a sumar`
            : `Ingresa el nuevo stock total (${producto.unidad})`
          }
        </p>
        <input
          className="bd-inp"
          type="number"
          placeholder={isIngreso ? `Cantidad a sumar (${producto.unidad})` : `Nuevo total (${producto.unidad})`}
          value={valor}
          onChange={e => setValor(e.target.value)}
          autoFocus
        />
        <div className="bd-modal-btns">
          <button className="bd-mbt bd-mbt-cancel" onClick={onClose}>Cancelar</button>
          <button className="bd-mbt bd-mbt-ok" onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 1: PEDIDOS
// ═══════════════════════════════════════════════════════════════
const FILTROS = [
  { key: "todos",          label: "Todas"      },
  { key: "pendiente",      label: "Nuevas"     },
  { key: "en_preparacion", label: "Preparando" },
  { key: "pausado",        label: "Pausadas"   },
  { key: "ancladas",       label: "Ancladas"   },
];

const PedidosTab = ({
  filtradas, ordenes, cargando, filtro, onFiltro,
  onCompletar, onPausar, onAnclar, onPreparar,
  onNueva, onLimpiarActivas, alertasStock, onIrInventario,
}) => {
  // Contadores por filtro
  const counts = {
    todos:          ordenes.length,
    pendiente:      ordenes.filter(o => o.estado === "pendiente").length,
    en_preparacion: ordenes.filter(o => o.estado === "en_preparacion").length,
    pausado:        ordenes.filter(o => o.estado === "pausado").length,
    ancladas:       ordenes.filter(o => o.anclada).length,
  };

  return (
    <div className="bd-page">
      {alertasStock.length > 0 && (
        <div className="bd-stock-banner" onClick={onIrInventario}>
          <span>⚠</span>
          <span className="bd-stock-banner-txt">
            Stock bajo: {alertasStock.map(p => `${p.nombre} (${p.stock_actual} ${p.unidad})`).join(" · ")}
          </span>
          <span className="bd-stock-banner-arrow">Ver inventario →</span>
        </div>
      )}

      <div className="bd-filters">
        {FILTROS.map(t => (
          <button
            key={t.key}
            className={`bd-filter-btn${filtro === t.key ? " active" : ""}`}
            onClick={() => onFiltro(t.key)}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span style={{
                marginLeft: 5, fontSize: 10, fontWeight: 800,
                background: filtro === t.key ? "rgba(255,255,255,.25)" : "var(--bd-card2)",
                padding: "1px 6px", borderRadius: 9,
              }}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bd-toolbar">
        <div className="bd-section-title">
          <span className="bd-pulse" />
          Órdenes activas
        </div>
        <div className="bd-toolbar-actions">
          <button className="bd-small-btn" onClick={onNueva}>+ Nueva orden</button>
          {ordenes.length > 0 && (
            <button className="bd-small-btn bd-small-btn-red" onClick={onLimpiarActivas}>
              Limpiar activas
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="bd-empty">
          <span className="bd-empty-icon">⏳</span>
          Cargando órdenes…
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bd-empty">
          <span className="bd-empty-icon">🍹</span>
          {filtro === "todos" ? "Sin órdenes activas" : `Sin órdenes en "${FILTROS.find(f=>f.key===filtro)?.label}"`}
        </div>
      ) : (
        <div className="bd-grid">
          {filtradas.map(o => (
            <OrderCard
              key={o.id} orden={o}
              onCompletar={onCompletar} onPausar={onPausar}
              onAnclar={onAnclar}       onPreparar={onPreparar}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 2: INVENTARIO — Grid de cards estilo imagen referencia
// ═══════════════════════════════════════════════════════════════
const InventarioTab = ({ inventario, lockState, onAgregar, onActualizar, onEliminar }) => {
  const [formOpen, setFormOpen]   = useState(false);
  const [form, setForm]           = useState({ nombre: "", unidad: "L", stock_actual: "", stock_minimo: 2, proveedor: "" });
  const [busqueda, setBusqueda]   = useState("");
  const [stockModal, setStockModal] = useState(null); // { producto, modo }

  const alertas = inventario.filter(p => Number(p.stock_actual) < Number(p.stock_minimo));
  const ok      = inventario.filter(p => Number(p.stock_actual) >= Number(p.stock_minimo));

  const filtrar = (lista) =>
    busqueda
      ? lista.filter(p =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          (p.proveedor||"").toLowerCase().includes(busqueda.toLowerCase())
        )
      : lista;

  const submitNuevo = () => {
    if (!form.nombre) return alert("Nombre requerido");
    onAgregar(form);
    setForm({ nombre: "", unidad: "L", stock_actual: "", stock_minimo: 2, proveedor: "" });
    setFormOpen(false);
  };

  const renderCard = (p) => {
    const isLow   = Number(p.stock_actual) < Number(p.stock_minimo);
    const pct     = pctStock(p.stock_actual, p.stock_minimo);

    return (
      <div key={p.id} className={`bd-inv-card${isLow ? " card-alert" : ""}`}>
        {/* Top */}
        <div className="bd-inv-card-top">
          <div className="bd-inv-card-info">
            <div className="bd-inv-card-name">{p.nombre}</div>
            {p.proveedor && (
              <div className="bd-inv-card-provider">{p.proveedor}</div>
            )}
          </div>
          {isLow
            ? <span className="bd-inv-status-low">BAJO</span>
            : <span className="bd-inv-status-ok">OK</span>
          }
        </div>

        {/* Barra */}
        <div className="bd-inv-bar-section">
          <div className="bd-inv-bar">
            <div
              className={`bd-inv-bar-fill${isLow ? " low" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="bd-inv-vals">
          <div>
            <div className="bd-inv-val-label">Actual</div>
            <div className={`bd-inv-val-num${isLow ? " low" : " ok"}`}>{p.stock_actual}</div>
            <div className="bd-inv-val-unit">{p.unidad}</div>
          </div>
          <div>
            <div className="bd-inv-val-label">Mínimo</div>
            <div className="bd-inv-val-num">{p.stock_minimo}</div>
            <div className="bd-inv-val-unit">{p.unidad}</div>
          </div>
        </div>

        {/* Acciones */}
        {lockState.editable ? (
          <div className="bd-inv-card-foot">
            <button className="bd-inv-btn-ingreso" onClick={() => setStockModal({ producto: p, modo: "ingreso" })}>
              + Ingreso
            </button>
            <button className="bd-inv-btn-ajustar" onClick={() => setStockModal({ producto: p, modo: "ajuste" })}>
              ✏ Ajustar
            </button>
            <button
              className="bd-inv-btn-del"
              onClick={() => { if (confirm(`¿Eliminar ${p.nombre}?`)) onEliminar(p.id); }}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="bd-inv-card-foot" style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "var(--bd-muted)" }}>🔒 Solo lectura</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bd-inv-page">
      {/* Modal de stock */}
      {stockModal && (
        <StockModal
          producto={stockModal.producto}
          modo={stockModal.modo}
          onClose={() => setStockModal(null)}
          onGuardar={(id, datos) => { onActualizar(id, datos); setStockModal(null); }}
        />
      )}

      {/* Header */}
      <div className="bd-inv-page-header">
        <div className="bd-inv-page-title">
          🍶 Inventario del Bar
        </div>
        <div className="bd-inv-page-actions">
          {lockState.editable
            ? <span className="bd-lock-on">🔓 {fmtCountdown(lockState.segundos_restantes)}</span>
            : <span className="bd-lock-off">🔒 Bloqueado</span>
          }
          {lockState.editable && (
            <button className="bd-inv-add-btn" onClick={() => setFormOpen(true)}>
              + Agregar producto
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda */}
      <input
        className="bd-inv-search"
        placeholder="Buscar producto o proveedor…"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ marginBottom: 18, display: "block", width: "100%", maxWidth: 320 }}
      />

      {/* Alerta de stock bajo */}
      {alertas.length > 0 && (
        <div className="bd-inv-alert-banner">
          ⚠ {alertas.length} producto{alertas.length !== 1 ? "s" : ""} con stock bajo:&nbsp;
          {alertas.map(p => p.nombre).join(", ")}
        </div>
      )}

      {/* Form nuevo producto */}
      {formOpen && (
        <div className="bd-inv-form-card">
          <div className="bd-inv-form-title">Nuevo producto</div>
          <div className="bd-form-row">
            <input className="bd-inp" placeholder="Nombre *" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <input className="bd-inp" placeholder="Proveedor" value={form.proveedor}
              onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} />
          </div>
          <div className="bd-form-row">
            <input className="bd-inp" placeholder="Unidad (L, kg, u…)" value={form.unidad}
              onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} />
            <input className="bd-inp" placeholder="Stock actual" type="number" value={form.stock_actual}
              onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
          </div>
          <div className="bd-form-row">
            <input className="bd-inp" placeholder="Mínimo diario" type="number" value={form.stock_minimo}
              onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
            <div />
          </div>
          <div className="bd-form-btns">
            <button className="bd-mbt bd-mbt-cancel" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button className="bd-mbt bd-mbt-ok" onClick={submitNuevo}>Guardar</button>
          </div>
        </div>
      )}

      {/* Grid alertas */}
      {filtrar(alertas).length > 0 && (
        <>
          <div className="bd-inv-section-label">⚠ Agotándose ({filtrar(alertas).length})</div>
          <div className="bd-inv-grid">{filtrar(alertas).map(renderCard)}</div>
        </>
      )}

      {/* Grid disponibles */}
      <div className="bd-inv-section-label">✅ Disponible ({filtrar(ok).length})</div>
      {filtrar(ok).length === 0
        ? <p style={{ color: "var(--bd-muted)", fontSize: 13 }}>
            {busqueda ? "Sin resultados para esa búsqueda" : "Sin productos con stock suficiente"}
          </p>
        : <div className="bd-inv-grid">{filtrar(ok).map(renderCard)}</div>
      }

      {!lockState.editable && (
        <div className="bd-inv-locked-msg">
          🔒 El inventario está bloqueado. Pide al admin que lo desbloquee para hacer cambios.
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 3: HISTORIAL
// ═══════════════════════════════════════════════════════════════
const HistorialTab = ({ historial, onLimpiar }) => {
  // Calcular stats del turno
  const totalBebidas  = historial.reduce((a, h) => a + h.drinks, 0);
  const tiemposProm   = historial.filter(h => h.at && h.ts).map(h => Math.round((h.at - h.ts) / 60000));
  const promPrep      = tiemposProm.length ? Math.round(tiemposProm.reduce((a, b) => a + b, 0) / tiemposProm.length) : 0;
  const maxMesa       = historial.length
    ? [...historial].sort((a, b) => b.drinks - a.drinks)[0]
    : null;

  return (
    <div className="bd-hist-page">
      <div className="bd-hist-page-header">
        <div className="bd-hist-page-title">📜 Historial del turno</div>
        {historial.length > 0 && (
          <button
            className="bd-small-btn bd-small-btn-red"
            onClick={() => { if (confirm("¿Limpiar historial?")) onLimpiar(); }}
          >
            Limpiar historial
          </button>
        )}
      </div>

      {historial.length > 0 && (
        <div className="bd-hist-meta-strip">
          <div className="bd-hist-meta-item">
            <span className="bd-hist-meta-label">Completadas</span>
            <span className="bd-hist-meta-val red">{historial.length}</span>
          </div>
          <div className="bd-hist-meta-item">
            <span className="bd-hist-meta-label">Bebidas servidas</span>
            <span className="bd-hist-meta-val gold">{totalBebidas}</span>
          </div>
          <div className="bd-hist-meta-item">
            <span className="bd-hist-meta-label">Prom. preparación</span>
            <span className="bd-hist-meta-val green">{promPrep}min</span>
          </div>
          {maxMesa && (
            <div className="bd-hist-meta-item">
              <span className="bd-hist-meta-label">Mesa más activa</span>
              <span className="bd-hist-meta-val">
                {maxMesa.mesa?.replace(/\D/g, "") || "?"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="bd-hist-list">
        {historial.length === 0 ? (
          <div className="bd-empty">
            <span className="bd-empty-icon">📋</span>
            Sin completadas aún
          </div>
        ) : (
          [...historial].reverse().map((h, i) => (
            <div key={i} className="bd-hist-row">
              <div className="bd-hist-left">
                <div className="bd-hist-name">
                  Mesa {h.mesa?.replace(/\D/g, "") || "?"} — {h.drink}
                </div>
                <div className="bd-hist-sub">{fmtFecha(h.at)}</div>
              </div>
              <div className="bd-hist-right">
                <div className="bd-hist-drinks">{h.drinks} bebida{h.drinks !== 1 ? "s" : ""}</div>
                <div className="bd-hist-dur">{Math.round((h.at - h.ts) / 60000)}min prep.</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HEADER CON TABS
// ═══════════════════════════════════════════════════════════════
const BarHeader = ({ ordenes, activeTab, onTabChange, theme, onToggleTheme, onLogout, turnoActivo, onCerrarTurno }) => {
  const tabs = [
    { key: "pedidos",    label: "Pedidos",    icon: "📋", count: ordenes.length },
    { key: "inventario", label: "Inventario", icon: "🍶", count: null },
    { key: "historial",  label: "Historial",  icon: "📜", count: null },
    { key: "sesiones",   label: "Sesiones",   icon: "📊", count: null },
  ];

  const urgentes = ordenes.filter(o =>
    (Date.now() - new Date(o.creado_en)) > 300000 && o.estado !== "pausado"
  ).length;

  return (
    <header className="bdh-root">
      <div className="bdh-top">
        {/* Brand */}
        <div className="bdh-brand">
          <div className="bdh-diamond">◆</div>
          <div>
            <div className="bdh-brand-name">MesaSmart</div>
            <div className="bdh-brand-sub">Bar · turno activo</div>
          </div>
        </div>

        {/* Stats */}
        <div className="bdh-stats">
          {[
            { label: "Activas",   value: ordenes.length,                                          color: "var(--bd-red2)",  tab: "todos"          },
            { label: "Nuevas",    value: ordenes.filter(o => o.estado === "pendiente").length,     color: "var(--bd-red)",   tab: "pendiente"      },
            { label: "Prep.",     value: ordenes.filter(o => o.estado === "en_preparacion").length, color: "var(--bd-amber)", tab: "en_preparacion" },
            { label: "Urgentes",  value: urgentes,                                                color: "#ff4444",         tab: "todos"          },
          ].map(s => (
            <div key={s.label} className="bdh-stat"
              onClick={() => { onTabChange("pedidos"); }}
            >
              <span className="bdh-stat-val" style={{ color: s.color }}>{s.value}</span>
              <span className="bdh-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="bdh-actions">
          <div className="bdh-live"><span className="bdh-live-dot" />En vivo</div>
          {turnoActivo && (
            <button className="bdh-icon-btn bdh-cierre-btn" onClick={onCerrarTurno} title="Cerrar turno">
              ⏹ Cerrar turno
            </button>
          )}
          <button className="bdh-icon-btn" onClick={onToggleTheme} title="Cambiar tema">
            {theme === "dark"
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
          <button className="bdh-icon-btn" onClick={onLogout} title="Salir">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="bd-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`bd-tab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="bd-tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>
    </header>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const BartenderDashboard = () => {
  const navigate = useNavigate();
  const { logout, token } = useAuth();

  const [ordenes,    setOrdenes]    = useState([]);
  const [historial,  setHistorial]  = useState([]);
  const [inventario, setInventario] = useState([]);
  const [lockState,  setLockState]  = useState({ editable: false, segundos_restantes: 0 });
  const [filtro,     setFiltro]     = useState("todos");
  const [theme,      setTheme]      = useState("dark");
  const [cargando,   setCargando]   = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [notif,      setNotif]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("pedidos");
  const [turnoId,    setTurnoId]    = useState(null);
  const [showCierre, setShowCierre] = useState(false);
  const [cerrando,   setCerrando]   = useState(false);
  const lockTimerRef = useRef(null);

  // ── Notificación con sonido ────────────────────────────────
  const notify = useCallback((txt) => {
    setNotif(txt);
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [[523, 0], [659, .18], [784, .34]].forEach(([f, t]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination); o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + t);
        g.gain.linearRampToValueAtTime(.13, ac.currentTime + t + .06);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t + .38);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + .45);
      });
    } catch (_) {}
    setTimeout(() => setNotif(null), 3500);
  }, []);

  // ── Countdown lock ─────────────────────────────────────────
  useEffect(() => {
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    if (lockState.editable && lockState.segundos_restantes > 0) {
      lockTimerRef.current = setInterval(() => {
        setLockState(prev => {
          const nuevo = prev.segundos_restantes - 1;
          if (nuevo <= 0) { clearInterval(lockTimerRef.current); return { editable: false, segundos_restantes: 0 }; }
          return { ...prev, segundos_restantes: nuevo };
        });
      }, 1000);
    }
    return () => clearInterval(lockTimerRef.current);
  }, [lockState.editable, lockState.segundos_restantes]);

  // ── Iniciar turno al entrar ────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const iniciar = async () => {
      try {
        const res  = await fetch(`${API}/api/bar/turno/iniciar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.ok) setTurnoId(data.turno_id);
      } catch (_) {}
    };
    iniciar();
  }, [token]);

  // ── Loaders ───────────────────────────────────────────────
  const cargarOrdenes = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/bar/ordenes`);
      const data = await res.json();
      if (data.ok) {
        const nuevas = data.ordenes.map(o => ({
          ...o,
          items:   typeof o.items === "string" ? JSON.parse(o.items) : o.items,
          anclada: !!o.anclada,
        }));
        setOrdenes(prev => {
          const ids = new Set(prev.map(x => x.id));
          nuevas.forEach(n => {
            if (!ids.has(n.id)) notify(`Nueva orden — Mesa ${n.mesa?.replace(/\D/g, "") || "?"}`);
          });
          return nuevas;
        });
      }
    } catch { setOrdenes([]); }
    finally  { setCargando(false); }
  }, [notify]);

  const cargarInventario = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/bar/inventario`);
      const d = await r.json();
      if (d.ok) setInventario(d.inventario);
    } catch (_) {}
  }, []);

  const cargarLock = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/bar/inventario/lock`);
      const d = await r.json();
      if (d.ok) setLockState({ editable: d.editable, segundos_restantes: d.segundos_restantes });
    } catch (_) {}
  }, []);

  useEffect(() => {
    cargarOrdenes(); cargarInventario(); cargarLock();
    const iv1 = setInterval(cargarOrdenes,    8000);
    const iv2 = setInterval(cargarInventario, 30000);
    const iv3 = setInterval(cargarLock,       15000);
    return () => { clearInterval(iv1); clearInterval(iv2); clearInterval(iv3); };
  }, [cargarOrdenes, cargarInventario, cargarLock]);

  // ── Acciones de órdenes ───────────────────────────────────
  const completarOrden = async (orden) => {
    try { await fetch(`${API}/api/bar/orden/${orden.id}`, { method: "PATCH" }); } catch (_) {}
    const drinks = orden.items?.reduce((a, i) => a + (typeof i === "object" ? i.cantidad : 1), 0) ?? 0;
    setHistorial(h => [...h, {
      mesa:  orden.mesa,
      drink: orden.items?.[0]?.nombre ?? "Bebida",
      drinks,
      at:    Date.now(),
      ts:    new Date(orden.creado_en).getTime(),
    }]);
    setOrdenes(o => o.filter(x => x.id !== orden.id));
    notify(`Mesa ${orden.mesa?.replace(/\D/g, "") || "?"} completada ✓`);
  };

  const pausarOrden = async (id) => {
    const o = ordenes.find(x => x.id === id); if (!o) return;
    const nuevo = o.estado === "pausado" ? "pendiente" : "pausado";
    try {
      await fetch(`${API}/api/bar/orden/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });
    } catch (_) {}
    setOrdenes(prev => prev.map(x => x.id === id ? { ...x, estado: nuevo } : x));
    notify(`Mesa ${o.mesa?.replace(/\D/g, "") || "?"} ${nuevo === "pausado" ? "pausada" : "reanudada"}`);
  };

  // ── NUEVO: pasar a "en_preparacion" ──────────────────────
  const prepararOrden = async (id) => {
    const o = ordenes.find(x => x.id === id); if (!o) return;
    try {
      await fetch(`${API}/api/bar/orden/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "en_preparacion" }),
      });
    } catch (_) {}
    setOrdenes(prev => prev.map(x => x.id === id ? { ...x, estado: "en_preparacion" } : x));
    notify(`Mesa ${o.mesa?.replace(/\D/g, "") || "?"} en preparación`);
  };

  const anclarOrden = async (id) => {
    try { await fetch(`${API}/api/bar/orden/${id}/anclar`, { method: "PATCH" }); } catch (_) {}
    setOrdenes(prev => prev.map(x => x.id === id ? { ...x, anclada: !x.anclada } : x));
  };

  // ── Acciones de inventario ────────────────────────────────
  const agregarProducto = async (form) => {
    try {
      await fetch(`${API}/api/bar/inventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      cargarInventario();
      notify("Producto agregado al inventario");
    } catch (_) {}
  };

  const actualizarProducto = async (id, datos) => {
    try {
      await fetch(`${API}/api/bar/inventario/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      cargarInventario();
      notify("Stock actualizado ✓");
    } catch (_) {}
  };

  const eliminarProducto = async (id) => {
    try {
      await fetch(`${API}/api/bar/inventario/${id}`, { method: "DELETE" });
      cargarInventario();
      notify("Producto eliminado");
    } catch (_) {}
  };

  // ── Limpiar activas ───────────────────────────────────────
  const limpiarActivas = () => {
    if (!ordenes.length) return;
    if (!confirm("¿Limpiar todas las órdenes activas? Se moverán al historial.")) return;
    ordenes.forEach(o => {
      const drinks = o.items?.reduce((a, i) => a + (typeof i === "object" ? i.cantidad : 1), 0) ?? 0;
      setHistorial(h => [...h, {
        mesa:  o.mesa,
        drink: o.items?.[0]?.nombre ?? "Bebida",
        drinks,
        at:    Date.now(),
        ts:    new Date(o.creado_en).getTime(),
      }]);
    });
    setOrdenes([]);
    notify("Órdenes activas limpiadas");
  };

  // ── Cerrar turno ──────────────────────────────────────────
  const confirmarCierre = async () => {
    if (!turnoId) return;
    setCerrando(true);
    try {
      const res  = await fetch(`${API}/api/bar/turno/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ turno_id: turnoId, historial }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowCierre(false);
        generarPDFTurno(data.resumen);
        notify("Turno cerrado — PDF generado");
        setTurnoId(null);
        setHistorial([]);
      } else {
        alert("Error al cerrar turno: " + data.error);
      }
    } catch {
      alert("Error de conexión al cerrar turno");
    } finally {
      setCerrando(false);
    }
  };

  // ── Filtrado y ordenamiento ───────────────────────────────
  const filtradas = (() => {
    let list = ordenes;
    if (filtro === "pendiente")      list = ordenes.filter(o => o.estado === "pendiente");
    else if (filtro === "en_preparacion") list = ordenes.filter(o => o.estado === "en_preparacion");
    else if (filtro === "pausado")   list = ordenes.filter(o => o.estado === "pausado");
    else if (filtro === "ancladas")  list = ordenes.filter(o => o.anclada);
    return [...list].sort((a, b) =>
      (b.anclada - a.anclada) || (new Date(a.creado_en) - new Date(b.creado_en))
    );
  })();

  const alertasStock = inventario.filter(p => Number(p.stock_actual) < Number(p.stock_minimo));

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={`bd-container theme-${theme}`}>
      <BarHeader
        ordenes={ordenes}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
        onLogout={async () => { await logout(); navigate("/login", { replace: true }); }}
        turnoActivo={!!turnoId}
        onCerrarTurno={() => setShowCierre(true)}
      />

      {/* Modales */}
      {showModal && (
        <NuevaOrdenModal
          onClose={() => setShowModal(false)}
          onAgregar={o => {
            setOrdenes(p => [...p, { ...o, id: Date.now() }]);
            notify(`Nueva orden — ${o.mesa}`);
          }}
        />
      )}
      {showCierre && (
        <CierreTurnoModal
          onConfirmar={confirmarCierre}
          onCancelar={() => setShowCierre(false)}
          cargando={cerrando}
        />
      )}

      {/* Contenido por tab */}
      <div className="bd-content">
        {notif && (
          <div style={{ padding: "14px 20px 0" }}>
            <div className="bd-notif">
              <span className="bd-notif-icon">🔔</span>
              <span>{notif}</span>
            </div>
          </div>
        )}

        {activeTab === "pedidos" && (
          <PedidosTab
            filtradas={filtradas}
            ordenes={ordenes}
            cargando={cargando}
            filtro={filtro}
            onFiltro={setFiltro}
            onCompletar={completarOrden}
            onPausar={pausarOrden}
            onAnclar={anclarOrden}
            onPreparar={prepararOrden}
            onNueva={() => setShowModal(true)}
            onLimpiarActivas={limpiarActivas}
            alertasStock={alertasStock}
            onIrInventario={() => setActiveTab("inventario")}
          />
        )}

        {activeTab === "inventario" && (
          <InventarioTab
            inventario={inventario}
            lockState={lockState}
            onAgregar={agregarProducto}
            onActualizar={actualizarProducto}
            onEliminar={eliminarProducto}
          />
        )}

        {activeTab === "historial" && (
          <HistorialTab
            historial={historial}
            onLimpiar={() => setHistorial([])}
          />
        )}

        {activeTab === "sesiones" && <SesionesContent />}
      </div>
    </div>
  );
};

export default BartenderDashboard;