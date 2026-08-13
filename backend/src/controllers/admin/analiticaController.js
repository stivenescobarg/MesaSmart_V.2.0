// backend/src/controllers/admin/analiticaController.js
const { pool } = require("../../config/db");
const Metrica  = require("../../models/Metrica");
const Egreso   = require("../../models/Egreso");

const fmtFecha = (d) => d.toISOString().split("T")[0];

const resolverRango = ({ periodo, fecha_desde, fecha_hasta }) => {
  if (periodo && periodo !== "personalizado") {
    const hoy = new Date();
    const desde = new Date(hoy);
    if (periodo === "semana") desde.setDate(hoy.getDate() - 7);
    if (periodo === "mes")    desde.setMonth(hoy.getMonth() - 1);
    if (periodo === "anio")   desde.setFullYear(hoy.getFullYear() - 1);
    return { fecha_desde: fmtFecha(desde), fecha_hasta: fmtFecha(hoy) };
  }
  return { fecha_desde, fecha_hasta };
};

const limiteSeguro = (limit, def = 5) => {
  const n = parseInt(limit, 10);
  if (!Number.isInteger(n) || n <= 0) return def;
  return Math.min(n, 100);
};

exports.getVentasAgrupadas = async (req, res) => {
  try {
    const { agrupacion = "dia", periodo, fecha_desde, fecha_hasta } = req.query;
    const rango = resolverRango({ periodo: periodo || "mes", fecha_desde, fecha_hasta });

    let selectEtiqueta;
    if (agrupacion === "semana") selectEtiqueta = "YEARWEEK(fecha, 3)";
    else if (agrupacion === "mes") selectEtiqueta = "DATE_FORMAT(fecha, '%Y-%m')";
    else selectEtiqueta = "fecha";

    const [rows] = await pool.execute(
      `SELECT ${selectEtiqueta} as etiqueta, MIN(fecha) as fecha_ref,
              COALESCE(SUM(total), 0) as total, COUNT(*) as cantidad
       FROM ventas
       WHERE restaurante_id = ? AND fecha >= ? AND fecha <= ?
       GROUP BY etiqueta
       ORDER BY fecha_ref ASC`,
      [req.restaurante_id, rango.fecha_desde, rango.fecha_hasta]
    );

    res.json({
      ok: true,
      datos: rows.map(r => ({
        etiqueta: agrupacion === "dia" ? r.fecha_ref : String(r.etiqueta),
        total: parseFloat(r.total) || 0,
        cantidad: parseInt(r.cantidad) || 0,
      })),
    });
  } catch (err) {
    console.error("[analitica/getVentasAgrupadas]", err);
    res.status(500).json({ msg: "Error al obtener ventas agrupadas." });
  }
};

exports.getIngresosVsGastos = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta } = req.query;
    const rango = resolverRango({ periodo: periodo || "mes", fecha_desde, fecha_hasta });

    const [ventasPorDia, gastosPorDia] = await Promise.all([
      pool.execute(
        `SELECT fecha, COALESCE(SUM(total),0) as total FROM ventas
         WHERE restaurante_id = ? AND fecha >= ? AND fecha <= ? GROUP BY fecha ORDER BY fecha ASC`,
        [req.restaurante_id, rango.fecha_desde, rango.fecha_hasta]
      ).then(([r]) => r),
      Egreso.getTotalPorDia({ ...rango, restaurante_id: req.restaurante_id }),
    ]);

    const mapaGastos = Object.fromEntries(gastosPorDia.map(g => [g.fecha, g.total]));
    const mapaVentas = Object.fromEntries(ventasPorDia.map(v => [
      v.fecha instanceof Date ? fmtFecha(v.fecha) : v.fecha,
      parseFloat(v.total) || 0,
    ]));

    const fechas = [...new Set([...Object.keys(mapaVentas), ...Object.keys(mapaGastos)])].sort();
    const datos = fechas.map(f => ({
      fecha: f,
      ingresos: mapaVentas[f] || 0,
      gastos: mapaGastos[f] || 0,
      flujo_neto: (mapaVentas[f] || 0) - (mapaGastos[f] || 0),
    }));

    res.json({ ok: true, datos });
  } catch (err) {
    console.error("[analitica/getIngresosVsGastos]", err);
    res.status(500).json({ msg: "Error al obtener ingresos vs gastos." });
  }
};

exports.getCategoriasMasVendidas = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta } = req.query;
    const rango = resolverRango({ periodo: periodo || "mes", fecha_desde, fecha_hasta });

    const [rows] = await pool.execute(
      `SELECT c.nombre as categoria,
              COALESCE(SUM(dv.cantidad), 0) as unidades,
              COALESCE(SUM(dv.cantidad * dv.precio), 0) as total
       FROM detalle_venta dv
       JOIN ventas v      ON v.id = dv.venta_id
       JOIN productos p   ON dv.nombre COLLATE utf8mb4_general_ci = p.nombre AND p.restaurante_id = v.restaurante_id
       JOIN categorias c  ON c.id = p.categoria_id
       WHERE v.restaurante_id = ? AND v.fecha >= ? AND v.fecha <= ?
       GROUP BY c.nombre
       ORDER BY total DESC`,
      [req.restaurante_id, rango.fecha_desde, rango.fecha_hasta]
    );

    res.json({
      ok: true,
      datos: rows.map(r => ({
        categoria: r.categoria,
        unidades: parseInt(r.unidades) || 0,
        total: parseFloat(r.total) || 0,
      })),
    });
  } catch (err) {
    console.error("[analitica/getCategoriasMasVendidas]", err);
    res.status(500).json({ msg: "Error al obtener categorías más vendidas." });
  }
};

exports.getTopProductos = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta, limit } = req.query;
    const rango = resolverRango({ periodo: periodo || "mes", fecha_desde, fecha_hasta });
    const lim = limiteSeguro(limit, 5);

    const [rows] = await pool.execute(
      `SELECT dv.nombre,
              COALESCE(SUM(dv.cantidad), 0) as unidades,
              COALESCE(SUM(dv.cantidad * dv.precio), 0) as total
       FROM detalle_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.restaurante_id = ? AND v.fecha >= ? AND v.fecha <= ?
       GROUP BY dv.nombre
       ORDER BY unidades DESC
       LIMIT ${lim}`,
      [req.restaurante_id, rango.fecha_desde, rango.fecha_hasta]
    );

    res.json({
      ok: true,
      datos: rows.map(r => ({ nombre: r.nombre, unidades: parseInt(r.unidades) || 0, total: parseFloat(r.total) || 0 })),
    });
  } catch (err) {
    console.error("[analitica/getTopProductos]", err);
    res.status(500).json({ msg: "Error al obtener productos más vendidos." });
  }
};

exports.getProductosMenorRotacion = async (req, res) => {
  try {
    const { limit } = req.query;
    const lim = limiteSeguro(limit, 5);

    const [rows] = await pool.execute(
      `SELECT p.nombre,
              COALESCE(SUM(dv.cantidad), 0) as unidades
       FROM productos p
       LEFT JOIN detalle_venta dv ON dv.nombre COLLATE utf8mb4_general_ci = p.nombre
       WHERE p.restaurante_id = ?
       GROUP BY p.nombre
       ORDER BY unidades ASC
       LIMIT ${lim}`,
      [req.restaurante_id]
    );

    res.json({
      ok: true,
      datos: rows.map(r => ({ nombre: r.nombre, unidades: parseInt(r.unidades) || 0 })),
    });
  } catch (err) {
    console.error("[analitica/getProductosMenorRotacion]", err);
    res.status(500).json({ msg: "Error al obtener productos de menor rotación." });
  }
};


exports.getMetodosPago = async (req, res) => {
  try {
    const { periodo, fecha_desde, fecha_hasta } = req.query;
    const rango = resolverRango({ periodo: periodo || "mes", fecha_desde, fecha_hasta });
    const datos = await Metrica.getMetodosPagoPeriodo({
      restaurante_id: req.restaurante_id,
      fecha_desde: rango.fecha_desde,
      fecha_hasta: rango.fecha_hasta,
    });
    res.json({ ok: true, datos });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener métodos de pago." });
  }
};