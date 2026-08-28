const ExcelJS            = require("exceljs");
const Metrica          = require("../../models/Metrica");
const Egreso            = require("../../models/Egreso");
const FacturaProveedor   = require("../../models/FacturaProveedor");
const { Caja }           = require("../../models/Caja");
const { Venta }          = require("../../models/Caja");
// const Producto           = require("../../models/Producto"); // pendiente: confirmar nombre real del modelo de stock

const fmtFecha = (d) => d.toISOString().split("T")[0];

const construirRangos = () => {
  const hoy = new Date();
  const hoyStr = fmtFecha(hoy);
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const inicioSemana = new Date(hoy); inicioSemana.setDate(hoy.getDate() - 7);
  const inicioSemanaPasada = new Date(hoy); inicioSemanaPasada.setDate(hoy.getDate() - 14);
  const finSemanaPasada = new Date(hoy); finSemanaPasada.setDate(hoy.getDate() - 8);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const finMesPasado     = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

  return {
    hoy:            { desde: hoyStr, hasta: hoyStr },
    ayer:           { desde: fmtFecha(ayer), hasta: fmtFecha(ayer) },
    semanaActual:   { desde: fmtFecha(inicioSemana), hasta: hoyStr },
    semanaPasada:   { desde: fmtFecha(inicioSemanaPasada), hasta: fmtFecha(finSemanaPasada) },
    mesActual:      { desde: fmtFecha(inicioMes), hasta: hoyStr },
    mesPasado:      { desde: fmtFecha(inicioMesPasado), hasta: fmtFecha(finMesPasado) },
  };
};

const pctCambio = (actual, anterior) => {
  if (!anterior || anterior === 0) return null;
  return Number((((actual - anterior) / anterior) * 100).toFixed(1));
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard-financiero/reporte?desde=...&hasta=...
// Devuelve el reporte del período en JSON (para verlo en pantalla
// antes de descargar el Excel, si el frontend lo llega a necesitar)
// ─────────────────────────────────────────────────────────────
exports.getReportePeriodo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ msg: "Debes enviar 'desde' y 'hasta' (YYYY-MM-DD)." });
    }

    const rid = req.restaurante_id;

    const [ventas, gastos, facturas] = await Promise.all([
      Venta.getAllPeriodo({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
      Egreso.getAllPeriodo({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
      FacturaProveedor.getAll({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
    ]);

    const totales = {
      ventas:    ventas.reduce((a, v) => a + v.total, 0),
      gastos:    gastos.reduce((a, g) => a + g.monto, 0),
      pagado:    facturas.reduce((a, f) => a + f.valor_pagado, 0),
      pendiente: facturas.reduce((a, f) => a + f.valor_pendiente, 0),
    };

    res.json({ ok: true, periodo: { desde, hasta }, totales, ventas, gastos, facturas });
  } catch (err) {
    console.error("[dashboard-financiero/getReportePeriodo]", err);
    res.status(500).json({ msg: "Error al generar el reporte del período." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard-financiero/reporte/excel?desde=...&hasta=...
// Genera y descarga el archivo .xlsx con ventas, gastos y cuentas por pagar
// ─────────────────────────────────────────────────────────────
exports.exportarExcel = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ msg: "Debes enviar 'desde' y 'hasta' (YYYY-MM-DD)." });
    }

    const rid = req.restaurante_id;
    const [ventas, gastos, facturas] = await Promise.all([
      Venta.getAllPeriodo({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
      Egreso.getAllPeriodo({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
      FacturaProveedor.getAll({ restaurante_id: rid, fecha_desde: desde, fecha_hasta: hasta }),
      // Producto.getAll(rid), // pendiente
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Dashboard Financiero";
    wb.created = new Date();

    // ---- Hoja Resumen ----
    const resumen = wb.addWorksheet("Resumen");
    resumen.columns = [{ header: "Indicador", key: "k", width: 30 }, { header: "Valor", key: "v", width: 20 }];
    const totalVentas = ventas.reduce((a, v) => a + v.total, 0);
    const totalGastos = gastos.reduce((a, g) => a + g.monto, 0);
    resumen.addRows([
      { k: "Período",           v: `${desde} a ${hasta}` },
      { k: "Total ventas",      v: totalVentas },
      { k: "Total gastos",      v: totalGastos },
      { k: "Utilidad neta",     v: totalVentas - totalGastos },
      { k: "Total pagado a proveedores", v: facturas.reduce((a, f) => a + f.valor_pagado, 0) },
      { k: "Total pendiente por pagar",  v: facturas.reduce((a, f) => a + f.valor_pendiente, 0) },
    ]);
    resumen.getRow(1).font = { bold: true };
    resumen.getColumn("v").numFmt = '"$"#,##0';

    // ---- Hoja Ventas ----
    const hVentas = wb.addWorksheet("Ventas");
    hVentas.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Mesa", key: "mesa_nombre", width: 20 },
      { header: "Método de pago", key: "metodo_pago", width: 18 },
      { header: "Total", key: "total", width: 15, style: { numFmt: '"$"#,##0' } },
    ];
    hVentas.addRows(ventas);
    hVentas.getRow(1).font = { bold: true };

    // ---- Hoja Gastos ----
    const hGastos = wb.addWorksheet("Gastos");
    hGastos.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Descripción", key: "descripcion", width: 30 },
      { header: "Monto", key: "monto", width: 15, style: { numFmt: '"$"#,##0' } },
    ];
    hGastos.addRows(gastos);
    hGastos.getRow(1).font = { bold: true };

    // ---- Hoja Cuentas por pagar ----
    const hFacturas = wb.addWorksheet("Cuentas x Pagar");
    hFacturas.columns = [
      { header: "Proveedor", key: "proveedor_nombre", width: 25 },
      { header: "Número", key: "numero", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Vence", key: "fecha_venc", width: 15 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Total", key: "valor_total", width: 15, style: { numFmt: '"$"#,##0' } },
      { header: "Pagado", key: "valor_pagado", width: 15, style: { numFmt: '"$"#,##0' } },
      { header: "Pendiente", key: "valor_pendiente", width: 15, style: { numFmt: '"$"#,##0' } },
    ];
    hFacturas.addRows(facturas);
    hFacturas.getRow(1).font = { bold: true };

    // ---- Hoja Stock ---- (pendiente: confirmar modelo real de productos)
    // const hStock = wb.addWorksheet("Stock actual");
    // hStock.columns = [
    //   { header: "Producto", key: "nombre", width: 30 },
    //   { header: "Stock actual", key: "stock_actual", width: 15 },
    //   { header: "Precio", key: "precio", width: 15, style: { numFmt: '"$"#,##0' } },
    // ];
    // hStock.addRows(productos);
    // hStock.getRow(1).font = { bold: true };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_financiero_${desde}_a_${hasta}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[dashboard-financiero/exportarExcel]", err);
    res.status(500).json({ msg: "Error al generar el Excel." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard-financiero
// KPIs del día/mes + comparaciones
// ─────────────────────────────────────────────────────────────
exports.getResumen = async (req, res) => {
  try {
    const rangos = construirRangos();
    const rid = req.restaurante_id;

    const [
      ventasHoy, ventasAyer, ventasSemana, ventasSemanaPasada, ventasMes, ventasMesPasado,
      gastosHoy, gastosMes,
      indicadoresFacturas,
      caja,
      productoEstrella,
      metodosPagoMes,
    ] = await Promise.all([
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.hoy.desde,          fecha_hasta: rangos.hoy.hasta }),
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.ayer.desde,         fecha_hasta: rangos.ayer.hasta }),
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.semanaActual.desde, fecha_hasta: rangos.semanaActual.hasta }),
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.semanaPasada.desde, fecha_hasta: rangos.semanaPasada.hasta }),
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.mesActual.desde,    fecha_hasta: rangos.mesActual.hasta }),
      Metrica.getVentasPeriodo({ restaurante_id: rid, fecha_desde: rangos.mesPasado.desde,    fecha_hasta: rangos.mesPasado.hasta }),
      Egreso.getTotalPeriodo({ restaurante_id: rid, fecha_desde: rangos.hoy.desde,       fecha_hasta: rangos.hoy.hasta }),
      Egreso.getTotalPeriodo({ restaurante_id: rid, fecha_desde: rangos.mesActual.desde, fecha_hasta: rangos.mesActual.hasta }),
      FacturaProveedor.getIndicadores(req.restaurante_id),
      Caja.getAbierta(rid),
      Metrica.getProductoEstrellaPeriodo({ restaurante_id: rid, fecha_desde: rangos.mesActual.desde, fecha_hasta: rangos.mesActual.hasta }),
      Metrica.getMetodosPagoPeriodo({ restaurante_id: rid, fecha_desde: rangos.mesActual.desde, fecha_hasta: rangos.mesActual.hasta }),
    ]);

    const utilidadHoy = ventasHoy.total - gastosHoy.total;
    const utilidadMes = ventasMes.total - gastosMes.total;
    const margenUtilidad = ventasMes.total > 0 ? Number(((utilidadMes / ventasMes.total) * 100).toFixed(1)) : 0;
    const ticketPromedio = ventasHoy.cantidad > 0 ? ventasHoy.total / ventasHoy.cantidad : 0;

    res.json({
      ok: true,
      kpis: {
        caja_disponible:    caja ? parseFloat(caja.monto_actual ?? caja.monto_inicial ?? 0) : 0,
        ventas_dia:         ventasHoy.total,
        ventas_mes:         ventasMes.total,
        utilidad_dia:       utilidadHoy,
        utilidad_mes:       utilidadMes,
        margen_utilidad:    margenUtilidad,
        clientes_atendidos: ventasHoy.cantidad,
        pedidos_realizados: ventasHoy.cantidad,
        ticket_promedio:    ticketPromedio,
        gastos_dia:         gastosHoy.total,
        gastos_mes:         gastosMes.total,
        facturas_pendientes: Number(indicadoresFacturas.facturas_vencidas) + Number(indicadoresFacturas.facturas_proximas),
      },
      comparaciones: {
        ventas_vs_ayer:         pctCambio(ventasHoy.total, ventasAyer.total),
        ventas_vs_semana_pasada: pctCambio(ventasSemana.total, ventasSemanaPasada.total),
        ventas_vs_mes_pasado:    pctCambio(ventasMes.total, ventasMesPasado.total),
      },
      productoEstrella,
      metodosPagoMes,
      facturasPendientes: {
        vencidas: indicadoresFacturas.facturas_vencidas,
        proximas: indicadoresFacturas.facturas_proximas,
        total_por_pagar: indicadoresFacturas.total_por_pagar,
      },
    });
  } catch (err) {
    console.error("[dashboard-financiero/getResumen]", err);
    res.status(500).json({ msg: "Error al obtener el resumen financiero." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard-financiero/ventas-vs-gastos
// Serie de los últimos 7 días para la gráfica de líneas
// ─────────────────────────────────────────────────────────────
exports.getVentasVsGastos = async (req, res) => {
  try {
    const hoy = new Date();
    const hace7 = new Date(hoy); hace7.setDate(hoy.getDate() - 6);
    const rango = { fecha_desde: fmtFecha(hace7), fecha_hasta: fmtFecha(hoy) };

    const [ventasPorDia, gastosPorDia] = await Promise.all([
      Metrica.getVentasPorDia(req.restaurante_id),
      Egreso.getTotalPorDia({ ...rango, restaurante_id: req.restaurante_id }),
    ]);

    const mapaGastos = Object.fromEntries(gastosPorDia.map(g => [g.fecha, g.total]));
    const combinado = ventasPorDia.map(v => ({
      dia:     v.dia,
      ventas:  v.total,
      gastos:  mapaGastos[v.fecha] || 0,
    }));

    res.json({ ok: true, datos: combinado });
  } catch (err) {
    console.error("[dashboard-financiero/getVentasVsGastos]", err);
    res.status(500).json({ msg: "Error al obtener ventas vs gastos." });
  }
};