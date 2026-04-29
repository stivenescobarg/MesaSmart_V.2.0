// frontend/src/components/admin/Dashboard.jsx
// Dashboard administrativo con métricas en tiempo real.
//
// Funcionalidades:
// - Mostrar ventas del día.
// - Visualizar métodos de pago.
// - Mostrar gráficas estadísticas.
// - Consultar productos con bajo stock.
// - Actualización automática cada 30 segundos.
//
// Librería utilizada:
// npm install recharts

import { useState, useEffect, useCallback } from "react";

// Componentes de gráficas de Recharts
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Servicios encargados de consumir la API
import { metricaService } from "../../services/metricaService";
import { stockService } from "../../services/stockService";

// ─────────────────────────────────────────────────────────────
// COLORES
// ─────────────────────────────────────────────────────────────

// Colores usados para la gráfica de métodos de pago
const COLORES_METODO = {
  efectivo: "#22c55e",
  tarjeta: "#3b82f6",
  transferencia: "#a855f7",
};

// Colores de las barras de ventas
const COLORES_BAR = [
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
  "#f59e0b",
];

// Función para convertir números a pesos colombianos
const COP = (n) =>
  `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// ─────────────────────────────────────────────────────────────
// TARJETA DE MÉTRICA
// ─────────────────────────────────────────────────────────────

// Componente reutilizable para mostrar métricas
const TarjetaMetrica = ({
  etiqueta,
  valor,
  sub,
  color = "var(--amber)",
  icono,
}) => (
  <div className="admin-card metrica-card">

    {/* Encabezado de la tarjeta */}
    <div className="metrica-card-header">

      {/* Icono */}
      <span className="metrica-card-icono">
        {icono}
      </span>

      {/* Nombre de la métrica */}
      <p className="metrica-etiqueta">
        {etiqueta}
      </p>
    </div>

    {/* Valor principal */}
    <p
      className="metrica-valor"
      style={{ color }}
    >
      {valor}
    </p>

    {/* Texto secundario opcional */}
    {sub && (
      <p className="metrica-sub">
        {sub}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// TOOLTIP PERSONALIZADO
// ─────────────────────────────────────────────────────────────

// Tooltip usado en las gráficas
const TooltipCOP = ({ active, payload, label }) => {

  // Si no hay información, no renderiza nada
  if (!active || !payload?.length) return null;

  return (
    <div className="grafica-tooltip">

      {/* Título */}
      {label && (
        <p className="tooltip-label">
          {label}
        </p>
      )}

      {/* Datos del tooltip */}
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color || "var(--amber)",
          }}
        >
          {p.name}: {COP(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

const Dashboard = ({ cajaAbierta }) => {

  // Resumen general de métricas
  const [resumen, setResumen] = useState(null);

  // Ventas de los últimos días
  const [ventasDia, setVentasDia] = useState([]);

  // Métodos de pago
  const [metodosPago, setMetodosPago] = useState([]);

  // Estado de carga
  const [cargando, setCargando] = useState(true);

  // Productos con stock bajo
  const [bajoStock, setBajoStock] = useState([]);

  // ─────────────────────────────────────────────────────────
  // FUNCIÓN PARA CARGAR TODAS LAS MÉTRICAS
  // ─────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {

    try {

      // Ejecuta todas las consultas al mismo tiempo
      const [r, vd, mp, bs] = await Promise.all([
        metricaService.getResumen(),
        metricaService.getVentasPorDia(),
        metricaService.getMetodosPago(),
        stockService.getBajoStock(),
      ]);

      // Guarda la información en los estados
      setResumen(r.resumen);
      setVentasDia(vd.datos || []);
      setMetodosPago(mp.datos || []);
      setBajoStock(bs.productos || []);

    } catch {

      // Error silencioso
      // Puede ocurrir cuando la caja está cerrada
    } finally {

      // Finaliza la carga
      setCargando(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // useEffect
  // ─────────────────────────────────────────────────────────

  useEffect(() => {

    // Carga inicial
    cargar();

    // Actualiza automáticamente cada 30 segundos
    const id = setInterval(cargar, 30000);

    // Limpia el intervalo al desmontar
    return () => clearInterval(id);

  }, [cargar]);

  // ─────────────────────────────────────────────────────────
  // ESTADO DE CARGA
  // ─────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="seccion-container">

        <div className="seccion-header">
          <h2 className="seccion-titulo">
            Dashboard
          </h2>
        </div>

        <p className="texto-secundario">
          Cargando métricas...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // DASHBOARD SIN CAJA ABIERTA
  // ─────────────────────────────────────────────────────────

  if (!cajaAbierta || !resumen) {

    return (
      <div className="seccion-container">

        <div className="seccion-header">
          <h2 className="seccion-titulo">
            Dashboard
          </h2>
        </div>

        {/* Gráfica de ventas históricas */}
        {ventasDia.length > 0 && (

          <div
            className="admin-card"
            style={{ marginBottom: "1rem" }}
          >

            <h3
              className="subtitulo"
              style={{ marginBottom: "1rem" }}
            >
              📈 Ventas — últimos 7 días
            </h3>

            <ResponsiveContainer width="100%" height={220}>

              <BarChart
                data={ventasDia}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >

                {/* Cuadrícula */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />

                {/* Eje X */}
                <XAxis
                  dataKey="dia"
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 11,
                  }}
                />

                {/* Eje Y */}
                <YAxis
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 11,
                  }}
                  tickFormatter={(v) =>
                    `$${(v / 1000).toFixed(0)}k`
                  }
                />

                {/* Tooltip */}
                <Tooltip content={<TooltipCOP />} />

                {/* Barras */}
                <Bar
                  dataKey="total"
                  name="Ventas"
                  fill="var(--amber)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mensaje cuando la caja está cerrada */}
        <div className="estado-vacio">
          <p className="texto-secundario">
            Abre la caja para ver las métricas
            en tiempo real del día.
          </p>
        </div>
      </div>
    );
  }

  // Variable de acceso rápido
  const r = resumen;

  // ─────────────────────────────────────────────────────────
  // DATOS PARA GRÁFICA DE PASTEL
  // ─────────────────────────────────────────────────────────

  const dataPastel = metodosPago
    .filter((m) => m.total > 0)
    .map((m) => ({
      name: m.metodo,
      value: m.total,
      color:
        COLORES_METODO[m.metodo] || "#f59e0b",
    }));

  return (

    <div className="seccion-container">

      {/* Encabezado */}
      <div className="seccion-header">

        <h2 className="seccion-titulo">
          Dashboard
        </h2>

        <span className="chip chip-verde">
          ● En vivo
        </span>
      </div>

      {/* ───────────────────────────── */}
      {/* TARJETAS DE MÉTRICAS */}
      {/* ───────────────────────────── */}

      <div className="dashboard-grid">

        <TarjetaMetrica
          icono="💰"
          etiqueta="Total vendido"
          valor={COP(r.total_vendido)}
          sub={`${r.cantidad_ventas} venta(s)`}
        />

        <TarjetaMetrica
          icono="💵"
          etiqueta="Efectivo"
          valor={COP(r.efectivo)}
          color="var(--green)"
        />

        <TarjetaMetrica
          icono="💳"
          etiqueta="Tarjeta + Transferencia"
          valor={COP(
            (r.tarjeta || 0) +
            (r.transferencia || 0)
          )}
          color="var(--blue)"
        />

        <TarjetaMetrica
          icono="📤"
          etiqueta="Egresos del día"
          valor={COP(r.total_egresos)}
          color="var(--red)"
        />

        <TarjetaMetrica
          icono="🏦"
          etiqueta="Efectivo neto en caja"
          valor={COP(r.efectivo_neto)}
          sub="Efectivo − egresos"
          color="var(--amber)"
        />

        <TarjetaMetrica
          icono="🍽️"
          etiqueta="Mesas"
          valor={`${r.mesas?.ocupadas || 0} ocupadas`}
          sub={`${r.mesas?.libres || 0} libres de ${r.mesas?.total || 0}`}
          color="var(--naranja)"
        />

        {/* Producto más vendido */}
        {r.producto_estrella && (

          <TarjetaMetrica
            icono="⭐"
            etiqueta="Producto estrella"
            valor={r.producto_estrella.nombre}
            sub={`${r.producto_estrella.cantidad} unidades vendidas`}
            color="var(--amber)"
          />
        )}
      </div>

      {/* ───────────────────────────── */}
      {/* GRÁFICAS */}
      {/* ───────────────────────────── */}

      <div className="dashboard-graficas">

        {/* MÉTODOS DE PAGO */}
        {dataPastel.length > 0 && (

          <div className="admin-card grafica-card">

            <h3
              className="subtitulo"
              style={{ marginBottom: "0.75rem" }}
            >
              🥧 Métodos de pago
            </h3>

            <ResponsiveContainer width="100%" height={220}>

              <PieChart>

                <Pie
                  data={dataPastel}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >

                  {/* Colores de cada sección */}
                  {dataPastel.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                {/* Tooltip */}
                <Tooltip formatter={(v) => COP(v)} />

                {/* Leyenda */}
                <Legend
                  formatter={(v) => (
                    <span
                      style={{
                        color: "var(--text-2)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {v}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VENTAS ÚLTIMOS 7 DÍAS */}
        {ventasDia.length > 0 && (

          <div className="admin-card grafica-card">

            <h3
              className="subtitulo"
              style={{ marginBottom: "0.75rem" }}
            >
              📈 Ventas — últimos 7 días
            </h3>

            <ResponsiveContainer width="100%" height={220}>

              <BarChart
                data={ventasDia}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="dia"
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "var(--text-2)",
                    fontSize: 11,
                  }}
                  tickFormatter={(v) =>
                    `$${(v / 1000).toFixed(0)}k`
                  }
                />

                <Tooltip content={<TooltipCOP />} />

                <Bar
                  dataKey="total"
                  name="Ventas"
                  fill="var(--amber)"
                  radius={[4, 4, 0, 0]}
                >

                  {/* Color individual para cada barra */}
                  {ventasDia.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        COLORES_BAR[
                          i % COLORES_BAR.length
                        ]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ───────────────────────────── */}
      {/* ALERTAS DE STOCK */}
      {/* ───────────────────────────── */}

      {bajoStock.length > 0 && (

        <div
          className="admin-card"
          style={{
            marginTop: "1rem",
            borderLeft: "3px solid var(--red)",
          }}
        >

          <h3
            className="subtitulo"
            style={{
              marginBottom: "0.75rem",
              color: "var(--red)",
            }}
          >
            ⚠️ Alertas de stock —
            {" "}
            {bajoStock.length}
            {" "}
            producto
            {bajoStock.length > 1 ? "s" : ""}
            {" "}
            bajo mínimo
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >

            {/* Muestra máximo 5 productos */}
            {bajoStock
              .slice(0, 5)
              .map((p) => (

              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.45rem 0.6rem",
                  background: "var(--bg)",
                  borderRadius: "var(--r-sm)",
                  border: "1px solid var(--border)",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >

                {/* Información del producto */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >

                  {/* Icono según categoría */}
                  <span style={{ fontSize: "0.8rem" }}>
                    {p.categoria === "bar"
                      ? "🍹"
                      : "🍳"}
                  </span>

                  {/* Nombre */}
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 500,
                    }}
                  >
                    {p.nombre}
                  </span>
                </div>

                {/* Estado del stock */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >

                  {/* Cantidad */}
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.75rem",
                      color:
                        p.cantidad_actual <= 0
                          ? "var(--red)"
                          : "var(--amber)",
                      fontWeight: 600,
                    }}
                  >
                    {p.cantidad_actual <= 0
                      ? "AGOTADO"
                      : `${p.cantidad_actual}/${p.cantidad_minima} ${p.unidad}`}
                  </span>

                  {/* Chip de estado */}
                  <span
                    className={`chip ${
                      p.cantidad_actual <= 0
                        ? "chip-rojo"
                        : "chip-amber"
                    }`}
                    style={{ fontSize: "0.65rem" }}
                  >
                    {p.cantidad_actual <= 0
                      ? "Agotado"
                      : "Bajo"}
                  </span>
                </div>
              </div>
            ))}

            {/* Texto adicional */}
            {bajoStock.length > 5 && (

              <p
                className="texto-muted"
                style={{
                  fontSize: "0.75rem",
                  textAlign: "center",
                  marginTop: "0.25rem",
                }}
              >
                +{bajoStock.length - 5}
                {" "}
                productos más con stock bajo —
                revisa la sección Stock
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Exporta el componente
export default Dashboard;