// frontend/src/components/bar/utils/pdfGenerator.js
import { fmtDuracion } from "./formatters";

// ── Genera y abre ventana de impresión con el resumen del turno ──
export const generarPDFTurno = (resumen) => {
  const {
    bartender, inicio, fin, duracion_min,
    total_bebidas, total_ordenes,
    detalle_bebidas = [], hora_pico, mesas_top = [],
  } = resumen;

  const fmt = (iso) =>
    new Date(iso).toLocaleString("es-CO", {
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

  const filasMesas = mesas_top.map((m) => `
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