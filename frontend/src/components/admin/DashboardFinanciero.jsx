// frontend/src/components/admin/DashboardFinanciero.jsx
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import { dashboardFinancieroService } from "../../services/dashboardFinancieroService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

const COLORES_METODO = { efectivo: "#22c55e", tarjeta: "#3b82f6", transferencia: "#a855f7" };

const hoyISO = () => new Date().toISOString().split("T")[0];
const haceDiasISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const TooltipCOP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="grafica-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--amber)" }}>{p.name}: {COP(p.value)}</p>
      ))}
    </div>
  );
};

// Flecha + color según si la comparación es positiva, negativa o sin datos
const Comparativa = ({ etiqueta, valor }) => {
  if (valor === null || valor === undefined) {
    return <span className="texto-muted" style={{ fontSize: "0.75rem" }}>{etiqueta}: sin datos previos</span>;
  }
  const positivo = valor >= 0;
  return (
    <span style={{ fontSize: "0.78rem", color: positivo ? "var(--green)" : "var(--red)" }}>
      {positivo ? "▲" : "▼"} {Math.abs(valor)}% <span className="texto-muted">{etiqueta}</span>
    </span>
  );
};

const TarjetaKPI = ({ etiqueta, valor, sub, color = "var(--amber)", icono }) => (
  <div className="admin-card metrica-card">
    <div className="metrica-card-header">
      <span className="metrica-card-icono">{icono}</span>
      <p className="metrica-etiqueta">{etiqueta}</p>
    </div>
    <p className="metrica-valor" style={{ color }}>{valor}</p>
    {sub && <p className="metrica-sub">{sub}</p>}
  </div>
);

const DashboardFinanciero = () => {
  const [datos,     setDatos]     = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(false);

  // ── Filtro de período para el reporte / Excel ──────────────
  const [desde, setDesde] = useState(() => haceDiasISO(30));
  const [hasta, setHasta] = useState(() => hoyISO());
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [resumen, ventasVsGastos] = await Promise.all([
        dashboardFinancieroService.getResumen(),
        dashboardFinancieroService.getVentasVsGastos(),
      ]);
      setDatos(resumen);
      setTendencia(ventasVsGastos.datos || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [cargar]);

  const handleDescargar = async () => {
    setErrorDescarga("");

    if (!desde || !hasta) {
      setErrorDescarga("Selecciona ambas fechas.");
      return;
    }
    if (desde > hasta) {
      setErrorDescarga("La fecha 'Desde' no puede ser posterior a 'Hasta'.");
      return;
    }

    setDescargando(true);
    try {
      await dashboardFinancieroService.descargarExcel(desde, hasta);
    } catch (err) {
      setErrorDescarga(err.message || "No se pudo generar el Excel. Intenta de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="seccion-container">
        <div className="seccion-header"><h2 className="seccion-titulo">📊 Dashboard Financiero</h2></div>
        <p className="texto-secundario">Cargando métricas financieras...</p>
      </div>
    );
  }

  if (error || !datos) {
    return (
      <div className="seccion-container">
        <div className="seccion-header"><h2 className="seccion-titulo">📊 Dashboard Financiero</h2></div>
        <div className="estado-vacio"><p className="texto-secundario">No se pudieron cargar las métricas. Intenta recargar.</p></div>
      </div>
    );
  }

  const { kpis, comparaciones, productoEstrella, metodosPagoMes, facturasPendientes } = datos;

  const dataPastel = (metodosPagoMes || [])
    .filter(m => m.total > 0)
    .map(m => ({ name: m.metodo, value: m.total, color: COLORES_METODO[m.metodo] || "#f59e0b" }));

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">📊 Dashboard Financiero</h2>
        <span className="chip chip-verde">● En vivo</span>
      </div>

      {/* ── Filtro de período + descarga de Excel ───────────────── */}
      <div className="admin-card" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <label className="texto-secundario" style={{ display: "block", fontSize: "0.8rem" }}>Desde</label>
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="input-fecha"
          />
        </div>
        <div>
          <label className="texto-secundario" style={{ display: "block", fontSize: "0.8rem" }}>Hasta</label>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={hoyISO()}
            onChange={(e) => setHasta(e.target.value)}
            className="input-fecha"
          />
        </div>
        <button className="btn btn-verde" onClick={handleDescargar} disabled={descargando}>
          {descargando ? "Generando..." : "📥 Descargar Excel del período"}
        </button>
        {errorDescarga && (
          <span style={{ color: "var(--red)", fontSize: "0.8rem", width: "100%" }}>{errorDescarga}</span>
        )}
      </div>

      {/* ── KPIs principales ─────────────────────────────────── */}
      <div className="dashboard-grid">
        <TarjetaKPI icono="🏦" etiqueta="Caja disponible" valor={COP(kpis.caja_disponible)} color="var(--amber)" />
        <TarjetaKPI icono="💰" etiqueta="Ventas del día" valor={COP(kpis.ventas_dia)} color="var(--green)"
          sub={<Comparativa etiqueta="vs ayer" valor={comparaciones.ventas_vs_ayer} />} />
        <TarjetaKPI icono="📈" etiqueta="Utilidad del día" valor={COP(kpis.utilidad_dia)}
          color={kpis.utilidad_dia >= 0 ? "var(--green)" : "var(--red)"} />
        <TarjetaKPI icono="📤" etiqueta="Gastos del día" valor={COP(kpis.gastos_dia)} color="var(--red)" />
        <TarjetaKPI icono="🧮" etiqueta="Margen de utilidad" valor={`${kpis.margen_utilidad}%`}
          color={kpis.margen_utilidad >= 0 ? "var(--green)" : "var(--red)"} />
        <TarjetaKPI icono="🎟️" etiqueta="Ticket promedio" valor={COP(kpis.ticket_promedio)} color="var(--blue)" />
        <TarjetaKPI icono="👥" etiqueta="Clientes atendidos (hoy)" valor={kpis.clientes_atendidos} color="var(--morado)" />
        <TarjetaKPI icono="📋" etiqueta="Pedidos realizados (hoy)" valor={kpis.pedidos_realizados} color="var(--naranja)" />
        <TarjetaKPI icono="💵" etiqueta="Ventas del mes" valor={COP(kpis.ventas_mes)} color="var(--green)"
          sub={<Comparativa etiqueta="vs mes pasado" valor={comparaciones.ventas_vs_mes_pasado} />} />
        <TarjetaKPI icono="📤" etiqueta="Gastos del mes" valor={COP(kpis.gastos_mes)} color="var(--red)" />
        <TarjetaKPI icono="📄" etiqueta="Facturas pendientes" valor={kpis.facturas_pendientes}
          color={kpis.facturas_pendientes > 0 ? "var(--amber)" : "var(--green)"}
          sub={facturasPendientes.vencidas > 0 ? `${facturasPendientes.vencidas} vencida(s)` : "Ninguna vencida"} />
        <TarjetaKPI icono="📅" etiqueta="Comparación semanal" valor=""
          sub={<Comparativa etiqueta="vs semana pasada" valor={comparaciones.ventas_vs_semana_pasada} />} />
      </div>

      {/* ── Gráficos ─────────────────────────────────────────── */}
      <div className="dashboard-graficas" style={{ marginTop: "1.25rem" }}>
        {tendencia.length > 0 && (
          <div className="admin-card grafica-card">
            <h3 className="subtitulo" style={{ marginBottom: "0.75rem" }}>📈 Ventas vs Gastos (últimos 7 días)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tendencia} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: "var(--text-2)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-2)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipCOP />} />
                <Legend formatter={(v) => <span style={{ color: "var(--text-2)", fontSize: "0.8rem" }}>{v}</span>} />
                <Line type="monotone" dataKey="ventas" name="Ventas" stroke="var(--green)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="var(--red)"   strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {dataPastel.length > 0 && (
          <div className="admin-card grafica-card">
            <h3 className="subtitulo" style={{ marginBottom: "0.75rem" }}>🥧 Ventas por método de pago (mes)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dataPastel} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {dataPastel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => COP(v)} />
                <Legend formatter={(v) => <span style={{ color: "var(--text-2)", fontSize: "0.8rem" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Producto estrella ────────────────────────────────── */}
      {productoEstrella && (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h3 className="subtitulo" style={{ marginBottom: "0.5rem" }}>⭐ Producto estrella del mes</h3>
          <p style={{ fontSize: "1rem", fontWeight: 600 }}>{productoEstrella.nombre}</p>
          <p className="texto-secundario">{productoEstrella.cantidad} unidades vendidas</p>
        </div>
      )}
    </div>
  );
};

export default DashboardFinanciero;
