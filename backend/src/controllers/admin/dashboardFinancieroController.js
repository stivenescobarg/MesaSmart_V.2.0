const Metrica          = require("../../models/Metrica");
const Egreso            = require("../../models/Egreso");
const FacturaProveedor   = require("../../models/FacturaProveedor");
const { Caja }           = require("../../models/Caja");

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
      FacturaProveedor.getIndicadores(req.restaurante_id), // ⚠️ ver aviso en el mensaje — todavía sin filtro de tenant
      Caja.getAbierta(rid), // 👈 FIX: antes no llevaba restaurante_id
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