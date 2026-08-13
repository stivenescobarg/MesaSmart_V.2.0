// backend/src/utils/generarPDF.js
// Genera el reporte de cierre de caja en PDF usando pdfkit.
// Retorna el PDF como string base64 para enviarlo al frontend.
//
// REDISEÑO (tema oscuro tipo dashboard): tarjetas redondeadas sobre fondo
// oscuro, badges de color por sección, resumen financiero en mini-tarjetas,
// tabla de productos con numeración, y caja destacada de efectivo esperado.

const PDFDocument = require("pdfkit");

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;
const fmtFecha = (f) => new Date(f).toLocaleString("es-CO", { timeZone: "America/Bogota" });
const fmtFechaCorta = (f) =>
  new Date(f).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" });
const fmtHora = (f) =>
  new Date(f).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" });

// ─── PALETA ──────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0e15",
  card: "#12161f",
  cardBorder: "#232938",
  headerBar: "#0d1119",
  white: "#f3f5f8",
  text: "#e5e7eb",
  gray: "#8b93a3",
  grayDim: "#5f6672",
  teal: "#2dd9c8",
  tealBg: "#0f2a27",
  amber: "#f0a52c",
  amberBg: "#2a2113",
  amberBorder: "#5c4415",
  red: "#ef5757",
  redBg: "#2a1616",
  green: "#3ecf72",
  greenBg: "#123322",
  blue: "#4f9dfb",
  blueBg: "#12233a",
  purple: "#b57bf2",
  purpleBg: "#251a33",
  rowAlt: "#171c27",
};

const PAGE_MARGIN = 40;
const CONTENT_W = 515; // 595.28 - 2*40 approx

// ─── HELPERS DE BAJO NIVEL ───────────────────────────────────────

const fillPageBg = (doc) => {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.bg);
};

const card = (doc, x, y, w, h, opts = {}) => {
  const { bg = COLORS.card, border = COLORS.cardBorder, radius = 8, lineWidth = 1 } = opts;
  doc.roundedRect(x, y, w, h, radius).fill(bg);
  if (border) {
    doc.roundedRect(x, y, w, h, radius).lineWidth(lineWidth).strokeColor(border).stroke();
  }
};

// Badge cuadrado redondeado con un ícono vectorial simple dibujado adentro.
const iconBadge = (doc, x, y, size, bgColor, fgColor, type) => {
  doc.roundedRect(x, y, size, size, size * 0.28).fill(bgColor);
  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size; // escala de referencia
  doc.strokeColor(fgColor).fillColor(fgColor).lineWidth(1.3).lineJoin("round").lineCap("round");

  switch (type) {
    case "calendar": {
      const w = s * 0.5, h = s * 0.42, rx = x + (s - w) / 2, ry = cy - h / 2 + s * 0.03;
      doc.roundedRect(rx, ry, w, h, 1.5).stroke();
      doc.moveTo(rx, ry + h * 0.32).lineTo(rx + w, ry + h * 0.32).stroke();
      doc.moveTo(rx + w * 0.28, ry - s * 0.06).lineTo(rx + w * 0.28, ry + s * 0.04).stroke();
      doc.moveTo(rx + w * 0.72, ry - s * 0.06).lineTo(rx + w * 0.72, ry + s * 0.04).stroke();
      break;
    }
    case "clock": {
      doc.circle(cx, cy, s * 0.26).stroke();
      doc.moveTo(cx, cy).lineTo(cx, cy - s * 0.15).stroke();
      doc.moveTo(cx, cy).lineTo(cx + s * 0.12, cy + s * 0.03).stroke();
      break;
    }
    case "person": {
      doc.circle(cx, cy - s * 0.09, s * 0.13).stroke();
      doc.path(`M ${cx - s * 0.18} ${cy + s * 0.24} Q ${cx} ${cy + s * 0.02} ${cx + s * 0.18} ${cy + s * 0.24}`).stroke();
      break;
    }
    case "cash": {
      doc.circle(cx, cy, s * 0.27).lineWidth(1.4).stroke();
      const fs = s * 0.36;
      doc.fontSize(fs).font("Helvetica-Bold").fillColor(fgColor)
        .text("$", x, cy - fs * 0.42, { width: s, align: "center" });
      break;
    }
    case "card": {
      const w = s * 0.5, h = s * 0.34, rx = x + (s - w) / 2, ry = cy - h / 2;
      doc.roundedRect(rx, ry, w, h, 1.5).stroke();
      doc.moveTo(rx, ry + h * 0.36).lineTo(rx + w, ry + h * 0.36).stroke();
      break;
    }
    case "transfer": {
      doc.moveTo(cx - s * 0.2, cy - s * 0.08).lineTo(cx + s * 0.16, cy - s * 0.08).stroke();
      doc.moveTo(cx + s * 0.08, cy - s * 0.16).lineTo(cx + s * 0.2, cy - s * 0.08).lineTo(cx + s * 0.08, cy).stroke();
      doc.moveTo(cx + s * 0.2, cy + s * 0.08).lineTo(cx - s * 0.16, cy + s * 0.08).stroke();
      doc.moveTo(cx - s * 0.08, cy).lineTo(cx - s * 0.2, cy + s * 0.08).lineTo(cx - s * 0.08, cy + s * 0.16).stroke();
      break;
    }
    case "down": {
      doc.moveTo(cx, cy - s * 0.2).lineTo(cx, cy + s * 0.16).stroke();
      doc.moveTo(cx - s * 0.13, cy + s * 0.03).lineTo(cx, cy + s * 0.16).lineTo(cx + s * 0.13, cy + s * 0.03).stroke();
      break;
    }
    case "vault": {
      const w = s * 0.48, h = s * 0.4, rx = x + (s - w) / 2, ry = cy - h / 2;
      doc.roundedRect(rx, ry, w, h, 2).stroke();
      doc.circle(cx, cy, s * 0.08).stroke();
      break;
    }
    case "bag": {
      const w = s * 0.4, h = s * 0.3, rx = x + (s - w) / 2, ry = cy - h / 2 + s * 0.05;
      doc.moveTo(rx, ry).lineTo(rx + w, ry).lineTo(rx + w * 0.85, ry + h).lineTo(rx + w * 0.15, ry + h).closePath().stroke();
      doc.path(`M ${cx - s * 0.1} ${ry} Q ${cx - s * 0.1} ${ry - s * 0.14} ${cx} ${ry - s * 0.14} Q ${cx + s * 0.1} ${ry - s * 0.14} ${cx + s * 0.1} ${ry}`).stroke();
      break;
    }
    case "chart": {
      const bx = x + s * 0.24, by = cy + s * 0.2;
      doc.rect(bx, by - s * 0.12, s * 0.1, s * 0.12).fill(fgColor);
      doc.rect(bx + s * 0.16, by - s * 0.24, s * 0.1, s * 0.24).fill(fgColor);
      doc.rect(bx + s * 0.32, by - s * 0.32, s * 0.1, s * 0.32).fill(fgColor);
      break;
    }
    case "shield": {
      const w = s * 0.34;
      doc.path(`M ${cx} ${cy - s * 0.26} L ${cx + w / 2} ${cy - s * 0.16} L ${cx + w / 2} ${cy + s * 0.04} Q ${cx + w / 2} ${cy + s * 0.24} ${cx} ${cy + s * 0.3} Q ${cx - w / 2} ${cy + s * 0.24} ${cx - w / 2} ${cy + s * 0.04} L ${cx - w / 2} ${cy - s * 0.16} Z`).stroke();
      doc.moveTo(cx - s * 0.08, cy).lineTo(cx - s * 0.02, cy + s * 0.07).lineTo(cx + s * 0.1, cy - s * 0.08).stroke();
      break;
    }
    case "document": {
      const w = s * 0.32, h = s * 0.42, rx = cx - w / 2, ry = cy - h / 2;
      doc.moveTo(rx, ry).lineTo(rx + w * 0.65, ry).lineTo(rx + w, ry + h * 0.28)
        .lineTo(rx + w, ry + h).lineTo(rx, ry + h).closePath().stroke();
      doc.moveTo(rx + w * 0.18, ry + h * 0.5).lineTo(rx + w * 0.82, ry + h * 0.5).stroke();
      doc.moveTo(rx + w * 0.18, ry + h * 0.7).lineTo(rx + w * 0.6, ry + h * 0.7).stroke();
      break;
    }
    case "star": {
      const r1 = s * 0.24, r2 = s * 0.1;
      let pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? r1 : r2;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
      }
      doc.polygon(...pts).fill(fgColor);
      break;
    }
    default:
      doc.circle(cx, cy, s * 0.2).stroke();
  }
  doc.lineWidth(1);
};

// Fila etiqueta:valor con badge de ícono a la izquierda
const iconLabelValue = (doc, x, y, opts) => {
  const { badgeSize = 22, bg, fg, icon, label, value, valueColor = COLORS.white, gap = 8, labelSize = 8, valueSize = 10.5 } = opts;
  iconBadge(doc, x, y, badgeSize, bg, fg, icon);
  const tx = x + badgeSize + gap;
  doc.font("Helvetica").fontSize(labelSize).fillColor(COLORS.gray).text(label, tx, y + 1);
  doc.font("Helvetica-Bold").fontSize(valueSize).fillColor(valueColor).text(value, tx, y + 12);
};

const sectionTitle = (doc, x, y, title, opts = {}) => {
  const { icon, iconBg = COLORS.amberBg, iconFg = COLORS.amber } = opts;
  let tx = x;
  if (icon) {
    iconBadge(doc, x, y - 2, 20, iconBg, iconFg, icon);
    tx = x + 28;
  }
  doc.font("Helvetica-Bold").fontSize(12.5).fillColor(COLORS.white).text(title, tx, y + 2);
  return y + 24;
};

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────

const generarPDF = ({ caja, ventas, egresos, cerradoPor, comparativaAyer }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4", bufferPages: true });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
      doc.on("error", reject);

      const C = COLORS;
      const pageW = doc.page.width;
      const contentX = PAGE_MARGIN;
      const contentW = pageW - PAGE_MARGIN * 2;

      fillPageBg(doc);
      doc.on("pageAdded", () => fillPageBg(doc));

      // Evita que una tarjeta se corte entre páginas: si no cabe, salta de página.
      const ensureSpace = (needed) => {
        if (doc.y + needed > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
        }
      };

      // ─── ENCABEZADO ────────────────────────────────────────────
      doc.roundedRect(contentX, PAGE_MARGIN, 46, 46, 12).fill(C.tealBg);
      doc.circle(contentX + 23, PAGE_MARGIN + 20, 7).lineWidth(1.4).strokeColor(C.teal).stroke();
      doc.moveTo(contentX + 23, PAGE_MARGIN + 27).lineTo(contentX + 23, PAGE_MARGIN + 34).strokeColor(C.teal).stroke();
      doc.moveTo(contentX + 15, PAGE_MARGIN + 34).lineTo(contentX + 31, PAGE_MARGIN + 34).strokeColor(C.teal).stroke();

      doc.font("Helvetica-Bold").fontSize(19).fillColor(C.teal)
        .text("MesaSmart", contentX + 56, PAGE_MARGIN + 6);
      doc.font("Helvetica").fontSize(9.5).fillColor(C.gray)
        .text("Reporte de cierre de caja", contentX + 56, PAGE_MARGIN + 28);

      const fechaBoxW = 190, fechaBoxH = 46, fechaBoxX = contentX + contentW - fechaBoxW;
      card(doc, fechaBoxX, PAGE_MARGIN, fechaBoxW, fechaBoxH, { bg: C.card, border: C.cardBorder, radius: 10 });
      iconBadge(doc, fechaBoxX + 10, PAGE_MARGIN + 12, 22, C.amberBg, C.amber, "calendar");
      doc.font("Helvetica").fontSize(7.5).fillColor(C.gray)
        .text("FECHA DEL REPORTE", fechaBoxX + 40, PAGE_MARGIN + 12);
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(C.white)
        .text(fmtFecha(new Date()), fechaBoxX + 40, PAGE_MARGIN + 24);

      doc.y = PAGE_MARGIN + 46 + 18;

      // ─── INFORMACIÓN DE LA JORNADA ───────────────────────────────
      const infoItems = [
        { icon: "calendar", bg: C.tealBg, fg: C.teal, label: "APERTURA", value: fmtFecha(caja.apertura) },
        { icon: "clock", bg: C.blueBg, fg: C.blue, label: "CIERRE", value: fmtFecha(new Date()) },
        { icon: "person", bg: C.purpleBg, fg: C.purple, label: "ABIERTO POR", value: caja.abierto_por_nombre || "—" },
        { icon: "person", bg: C.purpleBg, fg: C.purple, label: "CERRADO POR", value: cerradoPor?.nombre || cerradoPor?.correo || "—" },
        { icon: "cash", bg: C.amberBg, fg: C.amber, label: "MONTO INICIAL", value: COP(caja.monto_inicial) },
      ];

      const infoCardH = 118;
      ensureSpace(infoCardH + 10);
      let cy0 = doc.y;
      card(doc, contentX, cy0, contentW, infoCardH);
      let iy = cy0 + 16;
      sectionTitle(doc, contentX + 16, iy, "Información de la jornada", { icon: "calendar", iconBg: C.tealBg, iconFg: C.teal });
      iy += 28;

      const infoColW = (contentW - 32) / 3;
      infoItems.forEach((it, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const ix = contentX + 16 + col * infoColW;
        const rowY = iy + row * 44;
        iconLabelValue(doc, ix, rowY, { badgeSize: 22, bg: it.bg, fg: it.fg, icon: it.icon, label: it.label, value: it.value, valueSize: 10 });
      });
      doc.y = cy0 + infoCardH + 14;

      // ─── RESUMEN FINANCIERO ───────────────────────────────────────
      const totalVentas = parseFloat(caja.total_ventas) || ventas.reduce((a, v) => a + v.total, 0);
      const totalEgresos = egresos.reduce((a, e) => a + e.monto, 0);
      const efectivo = ventas.filter(v => v.metodo_pago === "efectivo").reduce((a, v) => a + v.total, 0);
      const tarjeta = ventas.filter(v => v.metodo_pago === "tarjeta").reduce((a, v) => a + v.total, 0);
      const transferencia = ventas.filter(v => v.metodo_pago === "transferencia").reduce((a, v) => a + v.total, 0);
      const efectivoNeto = (parseFloat(caja.monto_inicial) || 0) + efectivo - totalEgresos;

      const finCardH = 108;
      ensureSpace(finCardH + 10);
      cy0 = doc.y;
      card(doc, contentX, cy0, contentW, finCardH);
      iy = cy0 + 16;
      sectionTitle(doc, contentX + 16, iy, "Resumen financiero", { icon: "chart", iconBg: C.amberBg, iconFg: C.amber });
      iy += 30;

      const stats = [
        { icon: "cash", bg: C.tealBg, fg: C.teal, label: "Total vendido", value: COP(totalVentas), valColor: C.white },
        { icon: "cash", bg: C.greenBg, fg: C.green, label: "Efectivo", value: COP(efectivo), valColor: C.green },
        { icon: "card", bg: C.blueBg, fg: C.blue, label: "Tarjeta", value: COP(tarjeta), valColor: C.blue },
        { icon: "transfer", bg: C.purpleBg, fg: C.purple, label: "Transferencia", value: COP(transferencia), valColor: C.purple },
        { icon: "down", bg: C.redBg, fg: C.red, label: "Total egresos", value: COP(totalEgresos), valColor: C.red },
      ];
      const statGap = 10;
      const statW = (contentW - 32 - statGap * 4) / 5;
      stats.forEach((st, i) => {
        const sx = contentX + 16 + i * (statW + statGap);
        card(doc, sx, iy, statW, 56, { bg: C.rowAlt, border: C.cardBorder, radius: 8 });
        iconBadge(doc, sx + 8, iy + 8, 18, st.bg, st.fg, st.icon);
        doc.font("Helvetica").fontSize(7).fillColor(C.gray).text(st.label, sx + 8, iy + 32, { width: statW - 16 });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(st.valColor).text(st.value, sx + 8, iy + 42, { width: statW - 16 });
      });

      // Caja destacada "Efectivo en caja"
      const boxW = 150, boxH = 56, boxX = contentX + contentW - boxW, boxY = iy - 56 - 6;
      // Reposiciona: colocar como sexta tarjeta debajo o al lado — usamos fila propia debajo si no cabe.
      doc.y = cy0 + finCardH + 14;

      // Tarjeta destacada de efectivo en caja (ancho completo, debajo del resumen)
      const efCardH = 44;
      ensureSpace(efCardH + 10);
      cy0 = doc.y;
      card(doc, contentX, cy0, contentW, efCardH, { bg: C.amberBg, border: C.amberBorder, radius: 8, lineWidth: 1.2 });
      iconBadge(doc, contentX + 12, cy0 + 11, 22, "#3a2c15", C.amber, "vault");
      doc.font("Helvetica").fontSize(8).fillColor(C.gray).text("EFECTIVO EN CAJA (esperado)", contentX + 44, cy0 + 12);
      doc.font("Helvetica-Bold").fontSize(15).fillColor(C.amber)
        .text(COP(efectivoNeto), contentX, cy0 + 12, { width: contentW - 16, align: "right" });
      doc.y = cy0 + efCardH + 14;

      // ─── COMPARATIVA VS AYER ──────────────────────────────────────
      if (comparativaAyer) {
        const { ventasAyer = 0, gastosAyer = 0 } = comparativaAyer;
        const pctCambio = (actual, anterior) => (!anterior ? null : Number((((actual - anterior) / anterior) * 100).toFixed(1)));
        const pctVentas = pctCambio(totalVentas, ventasAyer);
        const pctGastos = pctCambio(totalEgresos, gastosAyer);

        const cmpH = 74;
        ensureSpace(cmpH + 10);
        cy0 = doc.y;
        card(doc, contentX, cy0, contentW, cmpH);
        iy = cy0 + 16;
        sectionTitle(doc, contentX + 16, iy, "Comparativa vs ayer", { icon: "chart", iconBg: C.blueBg, iconFg: C.blue });
        iy += 28;

        const half = (contentW - 32) / 2;
        const renderCmp = (x, label, actual, pct, anterior, invert = false) => {
          doc.font("Helvetica").fontSize(8).fillColor(C.gray).text(label, x, iy);
          doc.font("Helvetica-Bold").fontSize(12).fillColor(C.white).text(COP(actual), x, iy + 12);
          if (pct === null) {
            doc.font("Helvetica").fontSize(8).fillColor(C.grayDim).text("Sin datos de ayer", x, iy + 28);
          } else {
            const good = invert ? pct <= 0 : pct >= 0;
            const color = good ? C.green : C.red;
            const arrow = pct >= 0 ? "^" : "v";
            doc.font("Helvetica-Bold").fontSize(9).fillColor(color)
              .text(`${arrow} ${Math.abs(pct)}%  vs ayer (${COP(anterior)})`, x, iy + 28);
          }
        };
        renderCmp(contentX + 16, "VENTAS HOY", totalVentas, pctVentas, ventasAyer, false);
        renderCmp(contentX + 16 + half, "GASTOS HOY", totalEgresos, pctGastos, gastosAyer, true);
        doc.y = cy0 + cmpH + 14;
      }

      // ─── PRODUCTOS VENDIDOS (resumen) + TOP 3 ─────────────────────
      const productosMap = new Map();
      ventas.forEach(venta => {
        (venta.productos || venta.items || []).forEach(item => {
          const nombre = item.nombre || item.producto_nombre || "Producto sin nombre";
          const cantidad = parseFloat(item.cantidad) || 0;
          const precio = parseFloat(item.precio_unitario) || parseFloat(item.precio) || 0;
          const subtotal = parseFloat(item.subtotal) || (cantidad * precio);
          if (!productosMap.has(nombre)) productosMap.set(nombre, { cantidad: 0, total: 0 });
          const prod = productosMap.get(nombre);
          prod.cantidad += cantidad;
          prod.total += subtotal;
        });
      });
      const productosResumen = Array.from(productosMap.entries()).map(([nombre, data]) => ({
        nombre, cantidad: data.cantidad, total: data.total,
      }));

      const rowH = 24;
      const tableHeaderH = 22;
      const padTop = 44;

      if (productosResumen.length > 0) {
        const bodyH = productosResumen.length * rowH;
        const totalRowH = 22;
        const prodCardH = padTop + tableHeaderH + bodyH + totalRowH + 10;
        ensureSpace(Math.min(prodCardH, 250));
        cy0 = doc.y;
        card(doc, contentX, cy0, contentW, prodCardH);
        iy = cy0 + 16;
        sectionTitle(doc, contentX + 16, iy, "Productos vendidos (resumen)", { icon: "bag", iconBg: C.amberBg, iconFg: C.amber });
        iy += 28;

        const colX = { num: contentX + 16, prod: contentX + 50, cant: contentX + contentW - 190, tot: contentX + contentW - 110 };
        const headerY = iy;
        doc.rect(contentX + 16, headerY, contentW - 32, tableHeaderH).fill(C.rowAlt);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.gray);
        doc.text("#", colX.num + 2, headerY + 6);
        doc.text("PRODUCTO", colX.prod, headerY + 6);
        doc.text("CANTIDAD", colX.cant, headerY + 6, { width: 70, align: "right" });
        doc.text("TOTAL", colX.tot, headerY + 6, { width: 70, align: "right" });
        iy = headerY + tableHeaderH + 4;

        productosResumen.forEach((p, i) => {
          if (i % 2 === 0) doc.rect(contentX + 16, iy - 2, contentW - 32, rowH).fill(C.rowAlt);
          iconBadge(doc, colX.num, iy + 1, 18, C.amberBg, C.amber, "star");
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(p.nombre, colX.prod, iy + 4, { width: colX.cant - colX.prod - 10 });
          doc.font("Helvetica").fontSize(9).fillColor(C.gray).text(p.cantidad.toFixed(1), colX.cant, iy + 4, { width: 70, align: "right" });
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.amber).text(COP(p.total), colX.tot, iy + 4, { width: 70, align: "right" });
          iy += rowH;
        });

        doc.moveTo(contentX + 16, iy + 2).lineTo(contentX + contentW - 16, iy + 2).strokeColor(C.cardBorder).lineWidth(1).stroke();
        doc.font("Helvetica").fontSize(8.5).fillColor(C.gray).text("Total productos", colX.cant - 40, iy + 8, { width: 110, align: "right" });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.amber).text(COP(productosResumen.reduce((a, p) => a + p.total, 0)), colX.tot, iy + 8, { width: 70, align: "right" });

        doc.y = cy0 + prodCardH + 14;
      }

      // ─── VENTAS DEL DÍA ─────────────────────────────────────────
      const metodoIcon = { efectivo: ["cash", C.greenBg, C.green], tarjeta: ["card", C.blueBg, C.blue], transferencia: ["transfer", C.purpleBg, C.purple] };

      if (ventas.length > 0) {
        const bodyH = ventas.length * rowH;
        const ventasCardH = padTop + tableHeaderH + bodyH + 22 + 10;
        ensureSpace(Math.min(ventasCardH, 250));
        cy0 = doc.y;
        card(doc, contentX, cy0, contentW, ventasCardH);
        iy = cy0 + 16;
        sectionTitle(doc, contentX + 16, iy, "Ventas del día", { icon: "chart", iconBg: C.tealBg, iconFg: C.teal });
        iy += 28;

        const colX = { mesa: contentX + 16, metodo: contentX + 140, hora: contentX + 290, total: contentX + contentW - 110 };
        const headerY = iy;
        doc.rect(contentX + 16, headerY, contentW - 32, tableHeaderH).fill(C.rowAlt);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.gray);
        doc.text("MESA", colX.mesa, headerY + 6);
        doc.text("MÉTODO", colX.metodo, headerY + 6);
        doc.text("HORA", colX.hora, headerY + 6);
        doc.text("TOTAL", colX.total, headerY + 6, { width: 70, align: "right" });
        iy = headerY + tableHeaderH + 4;

        ventas.forEach((v, i) => {
          if (i % 2 === 0) doc.rect(contentX + 16, iy - 2, contentW - 32, rowH).fill(C.rowAlt);
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(v.mesa_nombre || "—", colX.mesa, iy + 4, { width: 110 });
          const mi = metodoIcon[v.metodo_pago] || ["cash", C.card, C.gray];
          iconBadge(doc, colX.metodo, iy + 1, 16, mi[1], mi[2], mi[0]);
          doc.font("Helvetica").fontSize(9).fillColor(C.text).text(v.metodo_pago || "—", colX.metodo + 22, iy + 4);
          doc.font("Helvetica").fontSize(9).fillColor(C.gray).text(v.hora || "—", colX.hora, iy + 4);
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.amber).text(COP(v.total), colX.total, iy + 4, { width: 70, align: "right" });
          iy += rowH;
        });

        doc.moveTo(contentX + 16, iy + 2).lineTo(contentX + contentW - 16, iy + 2).strokeColor(C.cardBorder).lineWidth(1).stroke();
        doc.font("Helvetica").fontSize(8.5).fillColor(C.gray).text("Total ventas", colX.hora, iy + 8, { width: 130, align: "right" });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.amber).text(COP(totalVentas), colX.total, iy + 8, { width: 70, align: "right" });

        doc.y = cy0 + ventasCardH + 14;
      }

      // ─── EGRESOS DEL DÍA ──────────────────────────────────────────
      if (egresos.length > 0) {
        const bodyH = egresos.length * rowH;
        const egCardH = padTop + tableHeaderH + bodyH + 22 + 10;
        ensureSpace(Math.min(egCardH, 250));
        cy0 = doc.y;
        card(doc, contentX, cy0, contentW, egCardH);
        iy = cy0 + 16;
        sectionTitle(doc, contentX + 16, iy, "Egresos del día", { icon: "down", iconBg: C.redBg, iconFg: C.red });
        iy += 28;

        const colX = { desc: contentX + 16, user: contentX + 290, monto: contentX + contentW - 110 };
        const headerY = iy;
        doc.rect(contentX + 16, headerY, contentW - 32, tableHeaderH).fill(C.rowAlt);
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.gray);
        doc.text("DESCRIPCIÓN", colX.desc, headerY + 6);
        doc.text("USUARIO", colX.user, headerY + 6);
        doc.text("MONTO", colX.monto, headerY + 6, { width: 70, align: "right" });
        iy = headerY + tableHeaderH + 4;

        egresos.forEach((e, i) => {
          if (i % 2 === 0) doc.rect(contentX + 16, iy - 2, contentW - 32, rowH).fill(C.rowAlt);
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(e.descripcion || "—", colX.desc, iy + 4, { width: 260 });
          doc.font("Helvetica").fontSize(9).fillColor(C.gray).text(e.usuario_nombre || "—", colX.user, iy + 4);
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.red).text(COP(e.monto), colX.monto, iy + 4, { width: 70, align: "right" });
          iy += rowH;
        });

        doc.moveTo(contentX + 16, iy + 2).lineTo(contentX + contentW - 16, iy + 2).strokeColor(C.cardBorder).lineWidth(1).stroke();
        doc.font("Helvetica").fontSize(8.5).fillColor(C.gray).text("Total egresos", colX.user, iy + 8, { width: 130, align: "right" });
        doc.font("Helvetica-Bold").fontSize(10).fillColor(C.red).text(COP(totalEgresos), colX.monto, iy + 8, { width: 70, align: "right" });

        doc.y = cy0 + egCardH + 14;

        // Gastos por categoría
        const porCategoria = new Map();
        egresos.forEach(e => {
          const cat = e.categoria || "Otros";
          porCategoria.set(cat, (porCategoria.get(cat) || 0) + (parseFloat(e.monto) || 0));
        });
        const filasCategoria = Array.from(porCategoria.entries())
          .map(([categoria, total]) => ({ categoria, total }))
          .sort((a, b) => b.total - a.total);

        if (filasCategoria.length > 0) {
          const catBodyH = filasCategoria.length * rowH;
          const catCardH = padTop + tableHeaderH + catBodyH + 6;
          ensureSpace(Math.min(catCardH, 250));
          cy0 = doc.y;
          card(doc, contentX, cy0, contentW, catCardH);
          iy = cy0 + 16;
          sectionTitle(doc, contentX + 16, iy, "Gastos por categoría", { icon: "chart", iconBg: C.redBg, iconFg: C.red });
          iy += 28;

          const headerY2 = iy;
          doc.rect(contentX + 16, headerY2, contentW - 32, tableHeaderH).fill(C.rowAlt);
          doc.font("Helvetica-Bold").fontSize(8).fillColor(C.gray);
          doc.text("CATEGORÍA", contentX + 24, headerY2 + 6);
          doc.text("TOTAL", contentX + contentW - 110, headerY2 + 6, { width: 70, align: "right" });
          iy = headerY2 + tableHeaderH + 4;

          filasCategoria.forEach((f, i) => {
            if (i % 2 === 0) doc.rect(contentX + 16, iy - 2, contentW - 32, rowH).fill(C.rowAlt);
            doc.font("Helvetica-Bold").fontSize(9).fillColor(C.white).text(f.categoria, contentX + 24, iy + 4);
            doc.font("Helvetica-Bold").fontSize(9).fillColor(C.red).text(COP(f.total), contentX + contentW - 110, iy + 4, { width: 70, align: "right" });
            iy += rowH;
          });
          doc.y = cy0 + catCardH + 14;
        }
      }

      // ─── TOTAL FINAL: EFECTIVO ESPERADO EN CAJA ───────────────────
      const finalBoxH = 54;
      ensureSpace(finalBoxH + 40);
      cy0 = doc.y;
      card(doc, contentX, cy0, contentW, finalBoxH, { bg: C.amberBg, border: C.amber, radius: 10, lineWidth: 1.5 });
      iconBadge(doc, contentX + 14, cy0 + 15, 24, "#3a2c15", C.amber, "vault");
      doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white)
        .text("EFECTIVO ESPERADO EN CAJA", contentX + 50, cy0 + 21);
      doc.font("Helvetica-Bold").fontSize(17).fillColor(C.amber)
        .text(COP(efectivoNeto), contentX, cy0 + 15, { width: contentW - 20, align: "right" });
      doc.y = cy0 + finalBoxH + 18;

      // ─── PIE DE PÁGINA: 3 tarjetas informativas ───────────────────
      const footH = 54;
      ensureSpace(footH + 10);
      cy0 = doc.y;
      const footGap = 10;
      const footW = (contentW - footGap * 2) / 3;

      // 1) Seguridad
      card(doc, contentX, cy0, footW, footH, { bg: C.rowAlt });
      iconBadge(doc, contentX + 10, cy0 + 10, 20, C.greenBg, C.green, "shield");
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.white).text("Sistema seguro y verificado", contentX + 38, cy0 + 10, { width: footW - 48 });
      doc.font("Helvetica").fontSize(7).fillColor(C.grayDim).text("Este reporte ha sido generado automáticamente por MesaSmart.", contentX + 10, cy0 + 34, { width: footW - 20 });

      // 2) Responsable / firma
      const c2x = contentX + footW + footGap;
      card(doc, c2x, cy0, footW, footH, { bg: C.rowAlt });
      doc.font("Helvetica-Oblique").fontSize(13).fillColor(C.white)
        .text(cerradoPor?.nombre || "Administrador", c2x, cy0 + 8, { width: footW, align: "center" });
      doc.moveTo(c2x + 20, cy0 + 28).lineTo(c2x + footW - 20, cy0 + 28).strokeColor(C.cardBorder).lineWidth(1).stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C.gray).text(cerradoPor?.nombre || cerradoPor?.correo || "Administrador", c2x, cy0 + 33, { width: footW, align: "center" });
      doc.font("Helvetica").fontSize(6.5).fillColor(C.grayDim).text("Responsable del cierre", c2x, cy0 + 43, { width: footW, align: "center" });

      // 3) Número de reporte
      const c3x = c2x + footW + footGap;
      card(doc, c3x, cy0, footW, footH, { bg: C.rowAlt });
      iconBadge(doc, c3x + 10, cy0 + 10, 20, C.blueBg, C.blue, "document");
      const numReporte = `CJA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(caja.id || "001").padStart(3, "0")}`;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.white).text(`Reporte #${numReporte}`, c3x + 38, cy0 + 10, { width: footW - 48 });
      doc.font("Helvetica").fontSize(7).fillColor(C.grayDim).text(`Generado el ${fmtFecha(new Date())} — MesaSmart v1.0`, c3x + 10, cy0 + 34, { width: footW - 20 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generarPDF;