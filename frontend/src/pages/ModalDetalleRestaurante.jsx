// frontend/src/pages/ModalDetalleRestaurante.jsx
import { useState, useEffect, useCallback } from "react";
import { superAdminService } from "../services/superAdminService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

const ESTADO_PAGO_CFG = {
  al_dia:    { label: "Al día",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  vencido:   { label: "Vencido",   color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  sin_pagos: { label: "Sin pagos registrados", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

const ESTADO_RESTAURANTE_CFG = {
  activo:     { label: "Activo",     color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  pendiente:  { label: "Pendiente",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  suspendido: { label: "Suspendido", color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
};

const METODOS_PAGO = ["transferencia", "efectivo", "tarjeta", "otro"];

const FORM_PAGO_VACIO = {
  monto: "", periodo_desde: "", periodo_hasta: "", fecha_pago: "", metodo_pago: "transferencia", notas: "",
};

const sumarUnMes = (fechaISO) => {
  const d = new Date(fechaISO);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const ModalDetalleRestaurante = ({ restauranteId, onCerrar }) => {
  const [detalle,   setDetalle]   = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form,         setForm]        = useState(FORM_PAGO_VACIO);
  const [guardando,    setGuardando]    = useState(false);
  const [errorForm,    setErrorForm]    = useState("");

  // ── Cambio de plan ──
  const [nuevoPlan,      setNuevoPlan]      = useState("basico");
  const [cambiandoPlan,  setCambiandoPlan]  = useState(false);
  const [errorPlan,      setErrorPlan]      = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await superAdminService.getDetalle(restauranteId);
      setDetalle(data);
      setNuevoPlan(data.restaurante.plan);
    } catch (err) {
      setError(err.message || "Error al cargar el detalle.");
    } finally {
      setCargando(false);
    }
  }, [restauranteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirForm = () => {
    const hoy = new Date().toISOString().split("T")[0];
    setForm({ ...FORM_PAGO_VACIO, fecha_pago: hoy, periodo_desde: hoy, periodo_hasta: sumarUnMes(hoy) });
    setErrorForm("");
    setMostrarForm(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePeriodoDesde = (v) => {
    set("periodo_desde", v);
    if (v) set("periodo_hasta", sumarUnMes(v));
  };

  const handleRegistrarPago = async () => {
    setErrorForm("");
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0) return setErrorForm("Ingresa un monto válido.");
    if (!form.periodo_desde || !form.periodo_hasta) return setErrorForm("El período que cubre el pago es requerido.");
    if (form.periodo_hasta < form.periodo_desde) return setErrorForm("'Periodo hasta' no puede ser anterior a 'Periodo desde'.");

    setGuardando(true);
    try {
      await superAdminService.registrarPago(restauranteId, {
        ...form,
        monto,
        fecha_pago: form.fecha_pago || new Date().toISOString().split("T")[0],
      });
      setMostrarForm(false);
      await cargar();
    } catch (err) {
      setErrorForm(err.message || "Error al registrar el pago.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPlan = async () => {
    setErrorPlan("");
    setCambiandoPlan(true);
    try {
      await superAdminService.cambiarPlan(restauranteId, nuevoPlan);
      await cargar();
    } catch (err) {
      setErrorPlan(err.message || "Error al cambiar el plan.");
    } finally {
      setCambiandoPlan(false);
    }
  };

  const planCambio = detalle && nuevoPlan !== detalle.restaurante.plan;

  return (
    <div className="sa-overlay" onClick={onCerrar}>
      <div className="sa-modal" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h2>Detalle del restaurante</h2>
          <button className="sa-modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {cargando && <p style={{ color: "#8791a2", fontSize: "0.85rem" }}>Cargando...</p>}
        {error && <div className="sa-error">{error}</div>}

        {detalle && (
          <>
            <div className="sa-modal-section-title">Información general</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <InfoCampo label="Nombre" valor={detalle.restaurante.nombre} />
              <InfoCampo label="Slug" valor={`/${detalle.restaurante.slug}`} mono />
              <InfoCampo
                label="Estado"
                valorNode={<EstadoBadge cfg={ESTADO_RESTAURANTE_CFG} valor={detalle.restaurante.estado} />}
              />
              <InfoCampo label="Creado" valor={new Date(detalle.restaurante.creado_en).toLocaleDateString("es-CO")} />
              <InfoCampo
                label="Activado"
                valor={detalle.restaurante.activado_en ? new Date(detalle.restaurante.activado_en).toLocaleDateString("es-CO") : "— aún no activado"}
              />
            </div>

            <div className="sa-modal-section-title" style={{ marginTop: "1.25rem" }}>Plan</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", flexWrap: "wrap" }}>
              <div className="sa-campo-grupo" style={{ margin: 0, flex: "0 0 200px" }}>
                <label>Plan actual</label>
                <select value={nuevoPlan} onChange={e => setNuevoPlan(e.target.value)}>
                  <option value="basico">Básico</option>
                  <option value="completo">Completo</option>
                </select>
              </div>
              <button
                className="sa-btn sa-btn-crear sa-btn-sm"
                onClick={handleCambiarPlan}
                disabled={!planCambio || cambiandoPlan}
              >
                {cambiandoPlan ? "Guardando..." : "Guardar plan"}
              </button>
            </div>
            {errorPlan && <div className="sa-error" style={{ marginTop: "0.5rem" }}>{errorPlan}</div>}
            <p style={{ color: "#697386", fontSize: "0.74rem", marginTop: "0.4rem" }}>
              El cambio aplica de inmediato — el restaurante gana o pierde acceso a las funciones del plan sin necesidad de que nadie reinicie sesión.
            </p>

            <div className="sa-modal-section-title" style={{ marginTop: "1.25rem" }}>Administrador del restaurante</div>
            {detalle.admin ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <InfoCampo label="Nombre" valor={detalle.admin.nombre} />
                <InfoCampo label="Correo" valor={detalle.admin.correo} mono />
              </div>
            ) : (
              <p style={{ color: "#697386", fontSize: "0.8rem" }}>No se encontró un usuario admin para este restaurante.</p>
            )}

            <div className="sa-modal-section-title" style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Suscripción</span>
              <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={abrirForm}>+ Registrar pago</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <EstadoBadge cfg={ESTADO_PAGO_CFG} valor={detalle.pago.estado} />
              {detalle.pago.ultimo && (
                <span style={{ color: "#8791a2", fontSize: "0.78rem" }}>
                  Cubre hasta {detalle.pago.ultimo.periodo_hasta} — último pago {COP(detalle.pago.ultimo.monto)}
                </span>
              )}
            </div>

            {mostrarForm && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #202838", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
                {errorForm && <div className="sa-error" style={{ marginBottom: "0.65rem" }}>{errorForm}</div>}

                <div className="sa-campo-grupo">
                  <label>Monto (COP)</label>
                  <input type="number" min="0" placeholder="0" value={form.monto} onChange={e => set("monto", e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="sa-campo-grupo">
                    <label>Periodo desde</label>
                    <input type="date" value={form.periodo_desde} onChange={e => handlePeriodoDesde(e.target.value)} />
                  </div>
                  <div className="sa-campo-grupo">
                    <label>Periodo hasta</label>
                    <input type="date" value={form.periodo_hasta} onChange={e => set("periodo_hasta", e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="sa-campo-grupo">
                    <label>Fecha del pago</label>
                    <input type="date" value={form.fecha_pago} onChange={e => set("fecha_pago", e.target.value)} />
                  </div>
                  <div className="sa-campo-grupo">
                    <label>Método</label>
                    <select value={form.metodo_pago} onChange={e => set("metodo_pago", e.target.value)}>
                      {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="sa-campo-grupo">
                  <label>Notas <span className="sa-opcional">(opcional)</span></label>
                  <input placeholder="Ej: pago vía Nequi, referencia #123" value={form.notas} onChange={e => set("notas", e.target.value)} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => setMostrarForm(false)}>Cancelar</button>
                  <button className="sa-btn sa-btn-crear sa-btn-sm" onClick={handleRegistrarPago} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar pago"}
                  </button>
                </div>
              </div>
            )}

            <div className="sa-modal-section-title">Historial de pagos</div>
            {detalle.pago.historial.length === 0 ? (
              <p style={{ color: "#697386", fontSize: "0.8rem" }}>Aún no hay pagos registrados.</p>
            ) : (
              <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #202838", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={thStyle}>Periodo</th>
                      <th style={thStyle}>Pagado el</th>
                      <th style={thStyle}>Método</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.pago.historial.map(p => (
                      <tr key={p.id} style={{ borderTop: "1px solid #181f2b" }}>
                        <td style={tdStyle}>{p.periodo_desde} → {p.periodo_hasta}</td>
                        <td style={tdStyle}>{p.fecha_pago}</td>
                        <td style={tdStyle}>{p.metodo_pago}</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: "#22c995", fontWeight: 600 }}>{COP(p.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

const InfoCampo = ({ label, valor, valorNode, mono }) => (
  <div>
    <p style={{ margin: "0 0 2px", color: "#697386", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
    {valorNode || (
      <p style={{ margin: 0, color: "#e7eaf0", fontSize: "0.85rem", fontFamily: mono ? "'SFMono-Regular', monospace" : "inherit" }}>
        {valor}
      </p>
    )}
  </div>
);

const EstadoBadge = ({ cfg, valor }) => {
  const c = cfg[valor] || { label: valor, color: "#8791a2", bg: "rgba(255,255,255,0.05)" };
  return (
    <span className="sa-badge" style={{ color: c.color, background: c.bg }}>{c.label}</span>
  );
};

const thStyle = { textAlign: "left", padding: "0.5rem 0.65rem", color: "#8791a2", fontWeight: 600 };
const tdStyle = { padding: "0.5rem 0.65rem", color: "#c7cdda" };

export default ModalDetalleRestaurante;