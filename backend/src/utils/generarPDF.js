// backend/src/utils/generarPDF.js
// Genera el reporte de cierre de caja en PDF usando pdfkit.
// Retorna el PDF como string base64 para enviarlo al frontend.

const PDFDocument = require("pdfkit");

// Formateador de moneda COP
const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// Formateador de fecha/hora
const fmtFecha = (f) => new Date(f).toLocaleString("es-CO");

// Dibuja una línea horizontal con color y grosor
const drawLine = (doc, y, x1 = 45, x2 = 550, color = "#c97d00", width = 1.5) => {
  doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(width).stroke();
};

// Dibuja el encabezado de una tabla (fondo oscuro y texto blanco)
const drawTableHeader = (doc, y, columns, colWidths, totalWidth = 505) => {
  doc.rect(45, y, totalWidth, 18).fill("#1a1916");
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
  const yText = y + 4;
  let xOffset = 45;
  columns.forEach((text, i) => {
    const w = colWidths[i] || 80;
    const align = i === columns.length - 1 ? "right" : "left";
    doc.text(text, xOffset, yText, { width: w, align });
    xOffset += w;
  });
  return y + 18; // retorna la nueva Y después del encabezado
};

// Dibuja una fila de tabla con fondo alternado
const drawTableRow = (doc, y, values, colWidths, rowHeight = 16, bgColor = null) => {
  if (bgColor) doc.rect(45, y - 2, 505, rowHeight).fill(bgColor);
  doc.fillColor("#1a1916").fontSize(9).font("Helvetica");
  const yText = y;
  let xOffset = 45;
  values.forEach((val, i) => {
    const w = colWidths[i] || 80;
    const align = i === values.length - 1 ? "right" : "left";
    // si es el último valor y es un monto, lo pintamos de ámbar
    if (i === values.length - 1 && typeof val === "string" && val.startsWith("$")) {
      doc.fillColor("#c97d00").font("Helvetica-Bold");
    } else {
      doc.fillColor("#1a1916").font("Helvetica");
    }
    doc.text(val, xOffset, yText, { width: w, align });
    xOffset += w;
  });
  return y + rowHeight;
};

const generarPDF = ({ caja, ventas, egresos, cerradoPor }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: "A4" });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
      doc.on("error", reject);

      // Colores
      const AMBER = "#c97d00";
      const DARK = "#1a1916";
      const GRAY = "#6b6860";
      const LIGHT = "#f0efe9";
      const RED = "#dc2626";

      // ─── ENCABEZADO ──────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(DARK);
      doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold")
         .text("◆  MesaSmart", 45, 22);
      doc.fillColor(AMBER).fontSize(10).font("Helvetica")
         .text("Reporte de cierre de caja", 45, 52);
      doc.moveDown(3);

      // ─── INFORMACIÓN DE LA JORNADA ──────────────────────────────
      doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
         .text("Información de la jornada");
      drawLine(doc, doc.y);
      doc.moveDown(0.4);

      const apertura = fmtFecha(caja.apertura);
      const cierre = fmtFecha(new Date());

      const infoRows = [
        ["Apertura:", apertura],
        ["Cierre:", cierre],
        ["Abierto por:", caja.abierto_por_nombre || "—"],
        ["Cerrado por:", cerradoPor?.nombre || cerradoPor?.correo || "—"],
        ["Monto inicial:", COP(caja.monto_inicial)],
      ];

      doc.fontSize(10).fillColor(DARK);
      infoRows.forEach(([label, valor]) => {
        doc.font("Helvetica-Bold").text(label, 45, doc.y, { continued: true, width: 160 });
        doc.font("Helvetica").fillColor(GRAY).text(valor);
        doc.fillColor(DARK);
      });
      doc.moveDown(1);

      // ─── RESUMEN FINANCIERO ──────────────────────────────────────
      doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
         .text("Resumen financiero");
      drawLine(doc, doc.y);
      doc.moveDown(0.4);

      const totalVentas = parseFloat(caja.total_ventas) || ventas.reduce((a, v) => a + v.total, 0);
      const totalEgresos = egresos.reduce((a, e) => a + e.monto, 0);
      const efectivo = ventas.filter(v => v.metodo_pago === "efectivo").reduce((a, v) => a + v.total, 0);
      const tarjeta = ventas.filter(v => v.metodo_pago === "tarjeta").reduce((a, v) => a + v.total, 0);
      const transferencia = ventas.filter(v => v.metodo_pago === "transferencia").reduce((a, v) => a + v.total, 0);
      const efectivoNeto = (parseFloat(caja.monto_inicial) || 0) + efectivo - totalEgresos;

      const finRows = [
        ["Total vendido:", COP(totalVentas), DARK],
        ["  Efectivo:", COP(efectivo), GRAY],
        ["  Tarjeta:", COP(tarjeta), GRAY],
        ["  Transferencia:", COP(transferencia), GRAY],
        ["Total egresos:", COP(totalEgresos), RED],
        ["Efectivo en caja:", COP(efectivoNeto), AMBER],
      ];

      doc.fontSize(10);
      finRows.forEach(([label, valor, color]) => {
        doc.font("Helvetica-Bold").fillColor(DARK).text(label, 45, doc.y, { continued: true, width: 200 });
        doc.font("Helvetica-Bold").fillColor(color).text(valor);
        doc.fillColor(DARK);
      });
      doc.moveDown(1);

      // ─── PRODUCTOS VENDIDOS (NUEVO) ─────────────────────────────
      // Agrupa productos desde todas las ventas
      const productosMap = new Map();
      ventas.forEach(venta => {
        (venta.productos || venta.items || []).forEach(item => {
          const nombre = item.nombre || item.producto_nombre || "Producto sin nombre";
          const cantidad = parseFloat(item.cantidad) || 0;
          const precio = parseFloat(item.precio_unitario) || parseFloat(item.precio) || 0;
          const subtotal = parseFloat(item.subtotal) || (cantidad * precio);
          if (!productosMap.has(nombre)) {
            productosMap.set(nombre, { cantidad: 0, total: 0 });
          }
          const prod = productosMap.get(nombre);
          prod.cantidad += cantidad;
          prod.total += subtotal;
        });
      });

      const productosResumen = Array.from(productosMap.entries()).map(([nombre, data]) => ({
        nombre,
        cantidad: data.cantidad,
        total: data.total,
      }));

      if (productosResumen.length > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
           .text("Productos vendidos (resumen)");
        drawLine(doc, doc.y, 45, 550, AMBER);
        doc.moveDown(0.3);

        // Columnas: Producto, Cantidad, Total
        const colWidths = [280, 100, 100];
        const headerY = doc.y;
        const newY = drawTableHeader(doc, headerY, ["Producto", "Cantidad", "Total"], colWidths);
        doc.y = newY;

        let rowY = doc.y;
        productosResumen.forEach((p, i) => {
          const bg = i % 2 === 0 ? LIGHT : null;
          const values = [p.nombre, p.cantidad.toFixed(1), COP(p.total)];
          rowY = drawTableRow(doc, rowY, values, colWidths, 16, bg);
        });
        doc.y = rowY + 4;

        // Línea total de productos (suma total)
        const totalProductos = productosResumen.reduce((acc, p) => acc + p.total, 0);
        if (Math.abs(totalProductos - totalVentas) > 0.01) {
          // Si hay diferencia, mostrar advertencia
          doc.fillColor(GRAY).fontSize(8).font("Helvetica")
             .text("Nota: La suma de productos no coincide con el total de ventas (posible redondeo).", 45, doc.y);
        }
        doc.moveDown(1);
      } else {
        doc.fontSize(10).fillColor(GRAY).text("No hay productos registrados en las ventas.", 45, doc.y);
        doc.moveDown(1);
      }

      // ─── VENTAS DEL DÍA ──────────────────────────────────────────
      if (ventas.length > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
           .text("Ventas del día");
        drawLine(doc, doc.y, 45, 550, AMBER);
        doc.moveDown(0.3);

        const colWidths = [100, 110, 80, 100];
        const headerY = doc.y;
        const newY = drawTableHeader(doc, headerY, ["Mesa", "Método", "Hora", "Total"], colWidths);
        doc.y = newY;

        let rowY = doc.y;
        ventas.forEach((v, i) => {
          const bg = i % 2 === 0 ? LIGHT : null;
          const values = [
            v.mesa_nombre || "—",
            v.metodo_pago || "—",
            v.hora || "—",
            COP(v.total),
          ];
          rowY = drawTableRow(doc, rowY, values, colWidths, 16, bg);
        });
        doc.y = rowY + 4;
        doc.moveDown(0.5);
      }

      // ─── EGRESOS DEL DÍA ─────────────────────────────────────────
      if (egresos.length > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
           .text("Egresos del día");
        drawLine(doc, doc.y, 45, 550, RED);
        doc.moveDown(0.3);

        const colWidths = [280, 100, 100];
        const headerY = doc.y;
        const newY = drawTableHeader(doc, headerY, ["Descripción", "Usuario", "Monto"], colWidths);
        doc.y = newY;

        let rowY = doc.y;
        egresos.forEach((e, i) => {
          const bg = i % 2 === 0 ? LIGHT : null;
          const values = [
            e.descripcion || "—",
            e.usuario_nombre || "—",
            COP(e.monto),
          ];
          rowY = drawTableRow(doc, rowY, values, colWidths, 16, bg);
        });
        doc.y = rowY + 4;
        doc.moveDown(0.5);
      }

      // ─── TOTAL FINAL ─────────────────────────────────────────────
      doc.rect(45, doc.y, 505, 40).fill(DARK);
      const yFinal = doc.y + 8;
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold")
         .text("EFECTIVO ESPERADO EN CAJA:", 55, yFinal, { continued: true, width: 350 });
      doc.fillColor(AMBER).fontSize(14)
         .text(COP(efectivoNeto), { align: "right" });

      // ─── PIE DE PÁGINA ──────────────────────────────────────────
      doc.moveDown(2);
      doc.fillColor(GRAY).fontSize(8).font("Helvetica")
         .text(`Generado el ${fmtFecha(new Date())} — MesaSmart v1.0`, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generarPDF;  