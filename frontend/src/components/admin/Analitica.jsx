// frontend/src/components/admin/Analitica.jsx
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { analiticaService } from "../../services/analiticaService";
import { colorPorIndice } from "../../services/egresoService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;
const COLORES_METODO = { efectivo: "#22c55e", tarjeta: "#3b82f6", transferencia: "#a855f7" };
const ALTURA_GRAFICA = 170; // un poco más chica para que 3 en fila se vean cómodas

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

// Grid reutilizable de 3 columnas (colapsa a menos si no cabe)
const GridTres = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "1rem",
      marginBottom: "1rem",
      alignItems: "stretch", // para que todas las cards de la fila tengan igual alto
    }}
  >
    {children}
  </div>
);

const Analitica = () => {
  const [periodo,      setPeriodo]      = useState("mes"); // semana | mes | anio
  const [agrupacion,   setAgrupacion]   = useState("dia"); // dia | semana | mes
  const [cargando,     setCargando]     = useState(true);

  const [ventasAgrupadas,   setVentasAgrupadas]   = useState([]);
  const [ingresosVsGastos,  setIngresosVsGastos]  = useState([]);
  const [categorias,        setCategorias]        = useState([]);
  const [topProductos,      setTopProductos]      = useState([]);
  const [menorRotacion,     setMenorRotacion]     = useState([]);
  const [metodosPago,       setMetodosPago]       = useState([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [va, ivg, cat, top, bottom, metodos] = await Promise.all([
        analiticaService.getVentasAgrupadas({ agrupacion, periodo }),
        analiticaService.getIngresosVsGastos({ periodo }),
        analiticaService.getCategoriasMasVendidas({ periodo }),
        analiticaService.getTopProductos({ periodo, limit: 5 }),
        analiticaService.getProductosMenorRotacion({ limit: 5 }),
        analiticaService.getMetodosPago({ periodo }),
      ]);
      setVentasAgrupadas(va.datos || []);
      setIngresosVsGastos(ivg.datos || []);
      setCategorias(cat.datos || []);
      setTopProductos(top.datos || []);
      setMenorRotacion(bottom.datos || []);
      setMetodosPago(metodos.datos || []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, agrupacion]);

  useEffect(() => { cargar(); }, [cargar]);

  const dataPastelMetodos = metodosPago
    .filter(m => m.total > 0)
    .map(m => ({ name: m.metodo, value: m.total, color: COLORES_METODO[m.metodo] || "#f59e0b" }));

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">📈 Analítica y Gráficas</h2>
      </div>

      {/* ── Filtros (sticky) ── */}
      <div
        className="stock-controles"
        style={{
          marginBottom: "1.25rem",
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--bg, #0b0b0f)",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
        }}
      >
        <div className="tab-selector">
          {[
            { key: "semana", label: "Última semana" },
            { key: "mes",    label: "Último mes" },
            { key: "anio",   label: "Último año" },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${periodo === key ? "activo" : ""}`} onClick={() => setPeriodo(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="tab-selector">
          {[
            { key: "dia",    label: "Por día" },
            { key: "semana", label: "Por semana" },
            { key: "mes",    label: "Por mes" },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${agrupacion === key ? "activo" : ""}`} onClick={() => setAgrupacion(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="texto-secundario">Cargando analítica...</p>
      ) : (
        <>
          {/* ── FILA 1: Ventas · Ingresos vs Gastos · Métodos de pago ── */}
          <GridTres>
            {ventasAgrupadas.length > 0 && (
              <div className="admin-card grafica-card" style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>💵 Ventas por período</h3>
                <ResponsiveContainer width="100%" height={ALTURA_GRAFICA}>
                  <BarChart data={ventasAgrupadas} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="etiqueta" tick={{ fill: "var(--text-2)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "var(--text-2)", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<TooltipCOP />} />
                    <Bar dataKey="total" name="Ventas" fill="var(--amber)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {ingresosVsGastos.length > 0 && (
              <div className="admin-card grafica-card" style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>📊 Ingresos vs Gastos</h3>
                <ResponsiveContainer width="100%" height={ALTURA_GRAFICA}>
                  <LineChart data={ingresosVsGastos} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="fecha" tick={{ fill: "var(--text-2)", fontSize: 8 }} />
                    <YAxis tick={{ fill: "var(--text-2)", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<TooltipCOP />} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-2)", fontSize: "0.7rem" }}>{v}</span>} />
                    <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--green)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gastos"   name="Gastos"   stroke="var(--red)"   strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {dataPastelMetodos.length > 0 && (
              <div className="admin-card grafica-card" style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>🥧 Métodos de pago</h3>
                <ResponsiveContainer width="100%" height={ALTURA_GRAFICA}>
                  <PieChart>
                    <Pie data={dataPastelMetodos} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                      {dataPastelMetodos.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => COP(v)} />
                    <Legend formatter={(v) => <span style={{ color: "var(--text-2)", fontSize: "0.7rem" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </GridTres>

          {/* ── FILA 2: Categorías · Top productos · Menor rotación ── */}
          <GridTres>
            {categorias.length > 0 && (
              <div className="admin-card grafica-card" style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>🍽️ Categorías más vendidas</h3>
                <ResponsiveContainer width="100%" height={ALTURA_GRAFICA}>
                  <BarChart data={categorias} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: "var(--text-2)", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="categoria" tick={{ fill: "var(--text-2)", fontSize: 10 }} width={70} />
                    <Tooltip content={<TooltipCOP />} />
                    <Bar dataKey="total" name="Ventas" fill="var(--morado)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {topProductos.length > 0 && (
              <div
                className="admin-card grafica-card"
                style={{ padding: "1rem", display: "flex", flexDirection: "column", minHeight: `${ALTURA_GRAFICA + 60}px` }}
              >
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>⭐ Top 5 más vendidos</h3>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-evenly" }}>
                  {topProductos.map((p, i) => (
                    <div
                      key={p.nombre}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        fontSize: "0.78rem",
                        padding: "0.25rem 0",
                        borderBottom: i < topProductos.length - 1 ? "1px solid var(--border, #26262e)" : "none",
                      }}
                    >
                      <span className="chip chip-amber" style={{ minWidth: "20px", justifyContent: "center", padding: "0.05rem", fontSize: "0.72rem" }}>{i + 1}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                      <span className="texto-muted" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem" }}>{p.unidades} und.</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--green)", fontWeight: 600, fontSize: "0.75rem", minWidth: "70px", textAlign: "right" }}>
                        {COP(p.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menorRotacion.length > 0 && (
              <div
                className="admin-card grafica-card"
                style={{ padding: "1rem", display: "flex", flexDirection: "column", minHeight: `${ALTURA_GRAFICA + 60}px` }}
              >
                <h3 className="subtitulo" style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>🐌 Menor rotación</h3>
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-evenly" }}>
                  {menorRotacion.map((p, i) => (
                    <div
                      key={p.nombre}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: "0.5rem", fontSize: "0.78rem",
                        padding: "0.25rem 0",
                        borderBottom: i < menorRotacion.length - 1 ? "1px solid var(--border, #26262e)" : "none",
                      }}
                    >
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                      <span className={`chip ${p.unidades === 0 ? "chip-rojo" : "chip-neutro"}`} style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem" }}>
                        {p.unidades} {p.unidades === 1 ? "und." : "und."}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="texto-muted" style={{ fontSize: "0.65rem", marginTop: "0.5rem" }}>
                  Incluye todo el catálogo, no solo el período filtrado.
                </p>
              </div>
            )}
          </GridTres>

          {ventasAgrupadas.length === 0 && ingresosVsGastos.length === 0 && (
            <div className="estado-vacio">
              <p className="texto-secundario">No hay suficientes datos de ventas en este período todavía.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analitica;