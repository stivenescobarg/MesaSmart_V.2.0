// backend/src/utils/generarPDF.js
// Genera el reporte de cierre de caja en PDF usando pdfkit.
// Instalar: npm install pdfkit
// Retorna el PDF como string base64 para enviarlo al frontend.

const PDFDocument = require("pdfkit");

const COP = (n) => `$${(parseFloat(n)||0).toLocaleString("es-CO")}`;

const generarPDF = ({ caja, ventas, egresos, cerradoPor }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ margin: 45, size: "A4" });
      const chunks = [];

      doc.on("data",  (c) => chunks.push(c));
      doc.on("end",   ()  => resolve(Buffer.concat(chunks).toString("base64")));
      doc.on("error", reject);

      const AMBER  = "#c97d00";
      const DARK   = "#1a1916";
      const GRAY   = "#6b6860";
      const LIGHT  = "#f0efe9";

      // ── ENCABEZADO ────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(DARK);
      doc.fillColor("#ffffff").fontSize(22).font("Helvetica-Bold")
         .text("◆  MesaSmart", 45, 22);
      doc.fillColor(AMBER).fontSize(10).font("Helvetica")
         .text("Reporte de cierre de caja", 45, 52);

      doc.moveDown(3);

      // ── INFO GENERAL ──────────────────────────────────────────
      doc.fillColor(DARK).fontSize(13).font("Helvetica-Bold")
         .text("Información de la jornada");
      doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor(AMBER).lineWidth(1.5).stroke();
      doc.moveDown(0.4);

      const apertura = new Date(caja.apertura).toLocaleString("es-CO");
      const cierre   = new Date().toLocaleString("es-CO");

      const infoRows = [
        ["Apertura:",          apertura],
        ["Cierre:",            cierre],
        ["Abierto por:",       caja.abierto_por_nombre  || "—"],
        ["Cerrado por:",       cerradoPor?.nombre || cerradoPor?.correo || "—"],
        ["Monto inicial:",     COP(caja.monto_inicial)],
      ];

      doc.font("Helvetica").fontSize(10).fillColor(DARK);
      infoRows.forEach(([label, valor]) => {
        doc.font("Helvetica-Bold").text(label, 45, doc.y, { continued: true, width: 160 });
        doc.font("Helvetica").fillColor(GRAY).text(valor);
        doc.fillColor(DARK);
      });

      doc.moveDown(1);

      // ── RESUMEN FINANCIERO ────────────────────────────────────
      doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK)
         .text("Resumen financiero");
      doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor(AMBER).lineWidth(1.5).stroke();
      doc.moveDown(0.4);

      const totalVentas   = parseFloat(caja.total_ventas)  || ventas.reduce((a,v)=>a+v.total,0);
      const totalEgresos  = egresos.reduce((a, e) => a + e.monto, 0);
      const efectivo      = ventas.filter(v=>v.metodo_pago==="efectivo").reduce((a,v)=>a+v.total,0);
      const tarjeta       = ventas.filter(v=>v.metodo_pago==="tarjeta").reduce((a,v)=>a+v.total,0);
      const transferencia = ventas.filter(v=>v.metodo_pago==="transferencia").reduce((a,v)=>a+v.total,0);
      const efectivoNeto  = (parseFloat(caja.monto_inicial)||0) + efectivo - totalEgresos;

      const finRows = [
        ["Total vendido:",       COP(totalVentas),   DARK],
        ["  Efectivo:",          COP(efectivo),      GRAY],
        ["  Tarjeta:",           COP(tarjeta),       GRAY],
        ["  Transferencia:",     COP(transferencia), GRAY],
        ["Total egresos:",       COP(totalEgresos),  "#dc2626"],
        ["Efectivo en caja:",    COP(efectivoNeto),  AMBER],
      ];

      doc.fontSize(10);
      finRows.forEach(([label, valor, color]) => {
        doc.font("Helvetica-Bold").fillColor(DARK).text(label, 45, doc.y, { continued: true, width: 200 });
        doc.font("Helvetica-Bold").fillColor(color).text(valor);
        doc.fillColor(DARK);
      });

      doc.moveDown(1);

      // ── TABLA DE VENTAS ───────────────────────────────────────
      if (ventas.length > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Ventas del día");
        doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor(AMBER).lineWidth(1.5).stroke();
        doc.moveDown(0.3);

        // Cabecera tabla
        doc.rect(45, doc.y, 505, 18).fill(DARK);
        doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
        const yH = doc.y + 4;
        doc.text("Mesa",    55,  yH, { width: 100 });
        doc.text("Método",  165, yH, { width: 110 });
        doc.text("Hora",    285, yH, { width: 80 });
        doc.text("Total",   430, yH, { width: 100, align: "right" });
        doc.moveDown(1.2);

        ventas.forEach((v, i) => {
          if (i % 2 === 0) doc.rect(45, doc.y - 2, 505, 16).fill(LIGHT);
          doc.fillColor(DARK).fontSize(9).font("Helvetica");
          const yR = doc.y;
          doc.text(v.mesa_nombre || "—", 55,  yR, { width: 100 });
          doc.text(v.metodo_pago || "—", 165, yR, { width: 110 });
          doc.text(v.hora        || "—", 285, yR, { width: 80 });
          doc.fillColor(AMBER).font("Helvetica-Bold")
             .text(COP(v.total), 430, yR, { width: 100, align: "right" });
          doc.moveDown(0.9);
        });

        doc.moveDown(0.5);
      }

      // ── TABLA DE EGRESOS ──────────────────────────────────────
      if (egresos.length > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor(DARK).text("Egresos del día");
        doc.moveTo(45, doc.y).lineTo(550, doc.y).strokeColor("#dc2626").lineWidth(1.5).stroke();
        doc.moveDown(0.3);

        doc.rect(45, doc.y, 505, 18).fill(DARK);
        doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
        const yH2 = doc.y + 4;
        doc.text("Descripción",   55,  yH2, { width: 280 });
        doc.text("Usuario",       345, yH2, { width: 100 });
        doc.text("Monto",         430, yH2, { width: 100, align: "right" });
        doc.moveDown(1.2);

        egresos.forEach((e, i) => {
          if (i % 2 === 0) doc.rect(45, doc.y - 2, 505, 16).fill(LIGHT);
          doc.fillColor(DARK).fontSize(9).font("Helvetica");
          const yR = doc.y;
          doc.text(e.descripcion          || "—", 55,  yR, { width: 280 });
          doc.text(e.usuario_nombre       || "—", 345, yR, { width: 100 });
          doc.fillColor("#dc2626").font("Helvetica-Bold")
             .text(COP(e.monto), 430, yR, { width: 100, align: "right" });
          doc.moveDown(0.9);
        });
        doc.moveDown(0.5);
      }

      // ── TOTAL FINAL ───────────────────────────────────────────
      doc.rect(45, doc.y, 505, 40).fill(DARK);
      const yFinal = doc.y + 8;
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold")
         .text("EFECTIVO ESPERADO EN CAJA:", 55, yFinal, { continued: true, width: 350 });
      doc.fillColor(AMBER).fontSize(14)
         .text(COP(efectivoNeto), { align: "right" });

      // ── PIE ───────────────────────────────────────────────────
      doc.moveDown(2);
      doc.fillColor(GRAY).fontSize(8).font("Helvetica")
         .text(`Generado el ${new Date().toLocaleString("es-CO")} — MesaSmart v1.0`,
               { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generarPDF;