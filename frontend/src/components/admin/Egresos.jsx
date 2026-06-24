// frontend/src/components/admin/Egresos.jsx
// Módulo de registro y visualización de egresos del día

import { useState, useEffect } from "react";
import { egresoService } from "../../services/egresoService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

const Egresos = ({ cajaAbierta, onEgresoCreado }) => {
  const [egresos,      setEgresos]      = useState([]);
  const [descripcion,  setDescripcion]  = useState("");
  const [monto,        setMonto]        = useState("");
  const [cargando,     setCargando]     = useState(false);
  const [error,        setError]        = useState("");
  const [mostrarForm,  setMostrarForm]  = useState(false);

  const cargarEgresos = async () => {
    try {
      const data = await egresoService.getActuales();
      setEgresos(data.egresos || []);
    } catch { /* silencioso */ }
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
      await egresoService.crear({ descripcion: descripcion.trim(), monto: montoNum });
      setDescripcion("");
      setMonto("");
      setMostrarForm(false);
      await cargarEgresos();
      if (onEgresoCreado) onEgresoCreado(); // notificar al dashboard para refrescar métricas
    } catch (err) {
      setError(err.message || "Error al registrar egreso.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Egresos del día</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="chip chip-rojo">
            Total: {COP(totalEgresos)}
          </span>
          {cajaAbierta && (
            <button
              className="btn-secundario"
              onClick={() => { setMostrarForm(!mostrarForm); setError(""); }}
            >
              {mostrarForm ? "Cancelar" : "+ Registrar egreso"}
            </button>
          )}
        </div>
      </div>

      {!cajaAbierta && (
        <div className="alerta-info">
          ⚠️ Abre la caja para registrar egresos del día.
        </div>
      )}

      {/* ── FORMULARIO ── */}
      {mostrarForm && cajaAbierta && (
        <div className="admin-card" style={{ marginBottom: "1rem" }}>
          <h3 className="subtitulo">Nuevo egreso</h3>

          {error && (
            <div className="alerta-error" style={{ marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCrear}>
            <div className="campo-grupo">
              <label className="campo-label">Descripción</label>
              <input
                className="campo-input"
                type="text"
                placeholder="Ej: Compra de insumos, pago de servicio..."
                value={descripcion}
                onChange={(e) => { setDescripcion(e.target.value); setError(""); }}
                autoFocus
              />
            </div>

            <div className="campo-grupo">
              <label className="campo-label">Monto ($)</label>
              <div className="input-prefijo">
                <span className="prefijo">$</span>
                <input
                  className="campo-input"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={monto}
                  onChange={(e) => { setMonto(e.target.value); setError(""); }}
                />
              </div>
            </div>

            <div className="form-botones">
              <button type="submit" className="btn-peligro" disabled={cargando}>
                {cargando ? "Registrando..." : "📤 Registrar egreso"}
              </button>
              <button
                type="button" className="btn-ghost"
                onClick={() => { setMostrarForm(false); setError(""); }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LISTA DE EGRESOS ── */}
      {egresos.length === 0 ? (
        <div className="estado-vacio">
          <p className="texto-secundario">
            {cajaAbierta
              ? "No hay egresos registrados en esta jornada."
              : "Los egresos aparecerán aquí cuando la caja esté abierta."}
          </p>
        </div>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Registrado por</th>
                <th>Hora</th>
                <th className="th-num">Monto</th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((eg, i) => (
                <tr key={eg.id || i}>
                  <td className="td-nombre">{eg.descripcion}</td>
                  <td>{eg.usuario_nombre || "—"}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>
                    {eg.hora || "—"}
                  </td>
                  <td className="td-num" style={{ color: "var(--red)", fontWeight: 600 }}>
                    {COP(eg.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right", fontWeight: 600, padding: "0.75rem 0.9rem", color: "var(--text-2)", fontSize: "0.8rem" }}>
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
    </div>
  );
};

export default Egresos;