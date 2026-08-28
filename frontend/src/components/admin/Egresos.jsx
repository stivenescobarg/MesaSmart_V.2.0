// frontend/src/components/admin/Egresos.jsx
// Módulo de Egresos + Control de Gastos ampliado
// Tab 1 "Registro del día": lo que ya tenías, ligado a la caja abierta
// Tab 2 "Control de Gastos": historial histórico con filtros de fecha + gráficos

import { useState, useEffect, useCallback } from "react";
import { egresoService, colorPorIndice } from "../../services/egresoService";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import RequierePlanCompleto from "./RequierePlanCompleto";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

const CATEGORIAS_DEFAULT = [
  "Compra de carne", "Compra de verduras", "Compra de bebidas", "Gas", "Agua",
  "Internet", "Luz", "Arriendo", "Nómina", "Mantenimiento", "Papelería",
  "Transporte", "Publicidad", "Domicilios", "Otros",
];

const TooltipCOP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="grafica-tooltip">
      {label && <p className="tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.payload?.fill || "var(--amber)" }}>
          {p.name}: {COP(p.value)}
        </p>
      ))}
    </div>
  );
};

const Egresos = ({ cajaAbierta, onEgresoCreado }) => {
  const [tab, setTab] = useState("registro"); // registro | control

  // Ambas pestañas de este módulo dependen de la misma feature de plan
  // ("gastos"), así que un 403 PLAN_INSUFICIENTE en cualquiera de las dos
  // bloquea el módulo completo con el mismo mensaje de upsell.
  const [planInsuficiente, setPlanInsuficiente] = useState(false);

  // ── Tab "Registro del día" (comportamiento original) ──
  const [egresos,      setEgresos]      = useState([]);
  const [descripcion,  setDescripcion]  = useState("");
  const [categoria,    setCategoria]    = useState("Otros");
  const [monto,        setMonto]        = useState("");
  const [cargando,     setCargando]     = useState(false);
  const [error,        setError]        = useState("");
  const [mostrarForm,  setMostrarForm]  = useState(false);

  // ── Tab "Control de Gastos" (histórico + gráficos) ──
  const [periodo,        setPeriodo]        = useState("mes"); // hoy | semana | mes | anio | personalizado
  const [fechaDesde,     setFechaDesde]     = useState("");
  const [fechaHasta,     setFechaHasta]     = useState("");
  const [filtroCat,      setFiltroCat]      = useState("");
  const [historial,      setHistorial]      = useState([]);
  const [porCategoria,   setPorCategoria]   = useState([]);
  const [porDia,         setPorDia]         = useState([]);
  const [cargandoControl,setCargandoControl]= useState(true);

  const cargarEgresos = async () => {
    try {
      const data = await egresoService.getActuales();
      setEgresos(data.egresos || []);
      setPlanInsuficiente(false);
    } catch (err) {
      if (err.codigo === "PLAN_INSUFICIENTE") setPlanInsuficiente(true);
      // si no es por plan, se queda en silencio como antes
    }
  };

  useEffect(() => { if (cajaAbierta) cargarEgresos(); }, [cajaAbierta]);

  const totalEgresos = egresos.reduce((a, e) => a + (parseFloat(e.monto) || 0), 0);

  const handleCrear = async (e) => {
    e?.preventDefault();
    const montoNum = parseFloat(monto);
    if (!descripcion.trim()) { setError("La descripción es requerida."); return; }
    if (!monto || montoNum <= 0) { setError("Ingresa un monto válido."); return; }

    setCargando(true);
    setError("");
    try {
      await egresoService.crear({ descripcion: descripcion.trim(), categoria, monto: montoNum });
      setDescripcion("");
      setCategoria("Otros");
      setMonto("");
      setMostrarForm(false);
      await cargarEgresos();
      if (onEgresoCreado) onEgresoCreado();
    } catch (err) {
      if (err.codigo === "PLAN_INSUFICIENTE") {
        setPlanInsuficiente(true);
      } else {
        setError(err.message || "Error al registrar egreso.");
      }
    } finally {
      setCargando(false);
    }
  };

  // ── Cargar datos del Control de Gastos ──
  const cargarControl = useCallback(async () => {
    setCargandoControl(true);
    try {
      const filtros = periodo === "personalizado"
        ? { periodo: "personalizado", fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
        : { periodo };

      const [dataHist, dataGraf] = await Promise.all([
        egresoService.getHistorial({ ...filtros, categoria: filtroCat || undefined }),
        egresoService.getGraficos(filtros),
      ]);
      setHistorial(dataHist.egresos || []);
      setPorCategoria(dataGraf.porCategoria || []);
      setPorDia(dataGraf.porDia || []);
      setPlanInsuficiente(false);
    } catch (err) {
      if (err.codigo === "PLAN_INSUFICIENTE") setPlanInsuficiente(true);
      // si no es por plan, se queda en silencio como antes
    }
    finally { setCargandoControl(false); }
  }, [periodo, fechaDesde, fechaHasta, filtroCat]);

  useEffect(() => {
    if (tab !== "control") return;
    if (periodo === "personalizado" && (!fechaDesde || !fechaHasta)) return; // esperar a que elija ambas fechas
    cargarControl();
  }, [tab, cargarControl, periodo, fechaDesde, fechaHasta]);

  const totalHistorial = historial.reduce((a, e) => a + e.monto, 0);
  const promedioDiario = porDia.length > 0 ? totalHistorial / porDia.length : 0;
  const mayorGasto  = porCategoria[0] || null;   // ya viene ordenado DESC por total
  const menorGasto  = porCategoria.length > 0 ? porCategoria[porCategoria.length - 1] : null;

  if (planInsuficiente) {
    return (
      <div className="seccion-container">
        <div className="seccion-header">
          <h2 className="seccion-titulo">💸 Egresos y Control de Gastos</h2>
        </div>
        <RequierePlanCompleto nombreSeccion="Egresos y Control de Gastos" />
      </div>
    );
  }

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">💸 Egresos y Control de Gastos</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="chip chip-rojo">Hoy: {COP(totalEgresos)}</span>
          {cajaAbierta && tab === "registro" && (
            <button className="btn-secundario" onClick={() => { setMostrarForm(!mostrarForm); setError(""); }}>
              {mostrarForm ? "Cancelar" : "+ Registrar egreso"}
            </button>
          )}
        </div>
      </div>

      <div className="tab-selector" style={{ marginBottom: "1rem", width: "fit-content" }}>
        <button className={`tab-btn ${tab === "registro" ? "activo" : ""}`} onClick={() => setTab("registro")}>
          📋 Registro del día
        </button>
        <button className={`tab-btn ${tab === "control" ? "activo" : ""}`} onClick={() => setTab("control")}>
          📊 Control de Gastos
        </button>
      </div>

      {/* ══════════════════ TAB: REGISTRO DEL DÍA ══════════════════ */}
      {tab === "registro" && (
        <>
          {!cajaAbierta && (
            <div className="alerta-info">⚠️ Abre la caja para registrar egresos del día.</div>
          )}

          {mostrarForm && cajaAbierta && (
            <div className="admin-card" style={{ marginBottom: "1rem" }}>
              <h3 className="subtitulo">Nuevo egreso</h3>

              {error && <div className="alerta-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}

              <form onSubmit={handleCrear}>
                <div className="campo-grupo">
                  <label className="campo-label">Descripción</label>
                  <input
                    className="campo-input" type="text"
                    placeholder="Ej: Compra de insumos, pago de servicio..."
                    value={descripcion}
                    onChange={(e) => { setDescripcion(e.target.value); setError(""); }}
                    autoFocus
                  />
                </div>

                <div className="campo-grupo">
                  <label className="campo-label">Categoría</label>
                  <select className="campo-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS_DEFAULT.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="campo-grupo">
                  <label className="campo-label">Monto ($)</label>
                  <div className="input-prefijo">
                    <span className="prefijo">$</span>
                    <input
                      className="campo-input" type="number" min="1" placeholder="0"
                      value={monto}
                      onChange={(e) => { setMonto(e.target.value); setError(""); }}
                    />
                  </div>
                </div>

                <div className="form-botones">
                  <button type="submit" className="btn-peligro" disabled={cargando}>
                    {cargando ? "Registrando..." : "📤 Registrar egreso"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { setMostrarForm(false); setError(""); }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {egresos.length === 0 ? (
            <div className="estado-vacio">
              <p className="texto-secundario">
                {cajaAbierta ? "No hay egresos registrados en esta jornada." : "Los egresos aparecerán aquí cuando la caja esté abierta."}
              </p>
            </div>
          ) : (
            <div className="tabla-wrapper">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Registrado por</th>
                    <th>Hora</th>
                    <th className="th-num">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {egresos.map((eg, i) => (
                    <tr key={eg.id || i}>
                      <td className="td-nombre">{eg.descripcion}</td>
                      <td><span className="chip chip-neutro">{eg.categoria || "Otros"}</span></td>
                      <td>{eg.usuario_nombre || "—"}</td>
                      <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>{eg.hora || "—"}</td>
                      <td className="td-num" style={{ color: "var(--red)", fontWeight: 600 }}>{COP(eg.monto)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 600, padding: "0.75rem 0.9rem", color: "var(--text-2)", fontSize: "0.8rem" }}>
                      TOTAL EGRESOS:
                    </td>
                    <td className="td-num" style={{ color: "var(--red)", fontWeight: 700, fontSize: "1rem" }}>
                      {COP(totalEgresos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════ TAB: CONTROL DE GASTOS ══════════════════ */}
      {tab === "control" && (
        <>
          {/* Filtros de periodo */}
          <div className="stock-controles" style={{ marginBottom: "1rem" }}>
            <div className="tab-selector">
              {[
                { key: "hoy",    label: "Hoy" },
                { key: "semana", label: "Esta semana" },
                { key: "mes",    label: "Este mes" },
                { key: "anio",   label: "Este año" },
                { key: "personalizado", label: "Rango personalizado" },
              ].map(({ key, label }) => (
                <button key={key} className={`tab-btn ${periodo === key ? "activo" : ""}`} onClick={() => setPeriodo(key)}>
                  {label}
                </button>
              ))}
            </div>
            <select className="campo-input" style={{ maxWidth: "220px" }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {CATEGORIAS_DEFAULT.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {periodo === "personalizado" && (
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="campo-grupo" style={{ margin: 0 }}>
                <label className="campo-label">Desde</label>
                <input className="campo-input" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
              </div>
              <div className="campo-grupo" style={{ margin: 0 }}>
                <label className="campo-label">Hasta</label>
                <input className="campo-input" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
              </div>
            </div>
          )}

          {cargandoControl ? (
            <p className="texto-secundario">Cargando datos de gastos...</p>
          ) : (
            <>
              {/* KPIs */}
              <div className="dashboard-grid" style={{ marginBottom: "1.25rem" }}>
                <div className="admin-card metrica-card">
                  <p className="metrica-etiqueta">Total del periodo</p>
                  <p className="metrica-valor" style={{ color: "var(--red)" }}>{COP(totalHistorial)}</p>
                </div>
                <div className="admin-card metrica-card">
                  <p className="metrica-etiqueta">Promedio diario</p>
                  <p className="metrica-valor" style={{ color: "var(--amber)" }}>{COP(promedioDiario)}</p>
                </div>
                <div className="admin-card metrica-card">
                  <p className="metrica-etiqueta">Mayor gasto</p>
                  <p className="metrica-valor" style={{ fontSize: "1.1rem" }}>{mayorGasto?.categoria || "—"}</p>
                  {mayorGasto && <p className="metrica-sub">{COP(mayorGasto.total)}</p>}
                </div>
                <div className="admin-card metrica-card">
                  <p className="metrica-etiqueta">Menor gasto</p>
                  <p className="metrica-valor" style={{ fontSize: "1.1rem" }}>{menorGasto?.categoria || "—"}</p>
                  {menorGasto && <p className="metrica-sub">{COP(menorGasto.total)}</p>}
                </div>
              </div>

              {/* Gráficos */}
              <div className="dashboard-graficas" style={{ marginBottom: "1.25rem" }}>
                {porCategoria.length > 0 && (
                  <div className="admin-card grafica-card">
                    <h3 className="subtitulo" style={{ marginBottom: "0.75rem" }}>🥧 Gastos por categoría</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={porCategoria} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="total" nameKey="categoria">
                          {porCategoria.map((_, i) => <Cell key={i} fill={colorPorIndice(i)} />)}
                        </Pie>
                        <Tooltip formatter={(v) => COP(v)} />
                        <Legend formatter={(v) => <span style={{ color: "var(--text-2)", fontSize: "0.8rem" }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {porDia.length > 0 && (
                  <div className="admin-card grafica-card">
                    <h3 className="subtitulo" style={{ marginBottom: "0.75rem" }}>📈 Tendencia de gastos</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={porDia} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="fecha" tick={{ fill: "var(--text-2)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "var(--text-2)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<TooltipCOP />} />
                        <Bar dataKey="total" name="Gastos" fill="var(--red)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabla de historial */}
              {historial.length === 0 ? (
                <div className="estado-vacio">
                  <p className="texto-secundario">No hay gastos registrados en este periodo.</p>
                </div>
              ) : (
                <div className="tabla-wrapper">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Registrado por</th>
                        <th className="th-num">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((eg) => (
                        <tr key={eg.id}>
                          <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>{eg.fecha}</td>
                          <td className="td-nombre">{eg.descripcion}</td>
                          <td><span className="chip chip-neutro">{eg.categoria || "Otros"}</span></td>
                          <td>{eg.usuario_nombre || "—"}</td>
                          <td className="td-num" style={{ color: "var(--red)", fontWeight: 600 }}>{COP(eg.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: "right", fontWeight: 600, padding: "0.75rem 0.9rem", color: "var(--text-2)", fontSize: "0.8rem" }}>
                          TOTAL DEL PERIODO:
                        </td>
                        <td className="td-num" style={{ color: "var(--red)", fontWeight: 700, fontSize: "1rem" }}>
                          {COP(totalHistorial)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Egresos;