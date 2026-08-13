// frontend/src/components/admin/CuentasPorPagar.jsx
// Gestión de facturas de proveedor (cuentas por pagar)

import { useState, useEffect, useCallback } from "react";
import { facturaProveedorService, colorEstadoFactura, etiquetaEstadoFactura } from "../../services/facturaProveedorService";
import { proveedorService } from "../../services/proveedorService";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;
const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"];
const ICONO_METODO = { efectivo: "💵", tarjeta: "💳", transferencia: "📲" };

const FORM_VACIO = { numero: "", proveedor_id: "", fecha: "", fecha_venc: "", valor_total: "", observaciones: "" };

const CuentasPorPagar = ({ toast }) => {
  const [facturas,    setFacturas]    = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [cargando,    setCargando]    = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroTiempo, setFiltroTiempo] = useState("todas"); // todas | vencidas | proximas

  // Modal crear factura
  const [modalCrear,  setModalCrear]  = useState(false);
  const [form,        setForm]        = useState(FORM_VACIO);
  const [procesando,  setProcesando]  = useState(false);
  const [errores,     setErrores]     = useState([]);

  // Modal registrar pago
  const [modalPago,   setModalPago]   = useState(null); // factura seleccionada
  const [montoPago,   setMontoPago]   = useState("");
  const [metodoPago,  setMetodoPago]  = useState("efectivo");
  const [obsPago,      setObsPago]     = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroEstado !== "todas") params.estado = filtroEstado;
      if (filtroTiempo === "vencidas") params.vencidas = true;
      if (filtroTiempo === "proximas") params.proximas = true;

      const [dataFacturas, dataIndicadores] = await Promise.all([
        facturaProveedorService.getAll(params),
        facturaProveedorService.getIndicadores(),
      ]);
      setFacturas(dataFacturas.facturas || []);
      setIndicadores(dataIndicadores.indicadores || null);
    } catch (err) {
      if (toast) toast.error("Error al cargar cuentas por pagar: " + err.message);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTiempo]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    proveedorService.getAll({ estado: "activo" })
      .then(data => setProveedores(data.proveedores || []))
      .catch(() => {});
  }, []);

  const abrirCrear = () => {
    setForm({ ...FORM_VACIO, fecha: new Date().toISOString().split("T")[0] });
    setErrores([]);
    setModalCrear(true);
  };

  const handleCrearFactura = async () => {
    const errs = [];
    if (!form.numero.trim())          errs.push("El número de factura es requerido.");
    if (!form.proveedor_id)           errs.push("Selecciona un proveedor.");
    if (!form.fecha)                  errs.push("La fecha es requerida.");
    if (!form.fecha_venc)             errs.push("La fecha de vencimiento es requerida.");
    if (!form.valor_total || Number(form.valor_total) <= 0) errs.push("El valor total debe ser mayor a 0.");
    if (form.fecha && form.fecha_venc && form.fecha_venc < form.fecha)
      errs.push("La fecha de vencimiento no puede ser anterior a la fecha de la factura.");
    if (errs.length > 0) { setErrores(errs); return; }

    setProcesando(true);
    try {
      await facturaProveedorService.crear({ ...form, valor_total: Number(form.valor_total) });
      if (toast) toast.exito(`Factura "${form.numero}" registrada`);
      setModalCrear(false);
      cargar();
    } catch (err) {
      setErrores([err.message || "Error al registrar la factura."]);
    } finally {
      setProcesando(false);
    }
  };

  const abrirPago = (factura) => {
    setModalPago(factura);
    setMontoPago("");
    setMetodoPago("efectivo");
    setObsPago("");
  };

  const handleRegistrarPago = async () => {
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) return toast?.error("Ingresa un monto válido.");
    if (monto > modalPago.valor_pendiente + 0.01)
      return toast?.error(`El monto no puede superar el pendiente (${COP(modalPago.valor_pendiente)}).`);

    setProcesando(true);
    try {
      await facturaProveedorService.registrarPago(modalPago.id, {
        monto, metodo_pago: metodoPago, observaciones: obsPago,
        fecha: new Date().toISOString().split("T")[0],
      });
      if (toast) toast.exito(`Pago de ${COP(monto)} registrado en "${modalPago.numero}"`);
      setModalPago(null);
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="seccion-container">

      <div className="seccion-header">
        <h2 className="seccion-titulo">📄 Proveedores / Cuentas por pagar</h2>
        <button className="btn-primario" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }} onClick={abrirCrear}>
          + Nueva factura
        </button>
      </div>

      {/* ── Indicadores ─────────────────────────────────────── */}
      {indicadores && (
        <div className="dashboard-grid" style={{ marginBottom: "1.25rem" }}>
          <div className="admin-card metrica-card">
            <p className="metrica-etiqueta">Total por pagar</p>
            <p className="metrica-valor" style={{ color: "var(--red)" }}>{COP(indicadores.total_por_pagar)}</p>
          </div>
          <div className="admin-card metrica-card">
            <p className="metrica-etiqueta">Total pagado</p>
            <p className="metrica-valor" style={{ color: "var(--green)" }}>{COP(indicadores.total_pagado)}</p>
          </div>
          <div className="admin-card metrica-card">
            <p className="metrica-etiqueta">Facturas vencidas</p>
            <p className="metrica-valor" style={{ color: "var(--red)" }}>{indicadores.facturas_vencidas}</p>
          </div>
          <div className="admin-card metrica-card">
            <p className="metrica-etiqueta">Próximas a vencer (7 días)</p>
            <p className="metrica-valor" style={{ color: "var(--amber)" }}>{indicadores.facturas_proximas}</p>
          </div>
        </div>
      )}

      {/* ── Filtros ─────────────────────────────────────────── */}
      <div className="stock-controles" style={{ marginBottom: "1rem" }}>
        <div className="tab-selector">
          {["todas", "pendiente", "parcial", "pagada"].map(e => (
            <button key={e} className={`tab-btn ${filtroEstado === e ? "activo" : ""}`}
              onClick={() => setFiltroEstado(e)}>
              {e === "todas" ? "Todas" : etiquetaEstadoFactura(e)}
            </button>
          ))}
        </div>
        <div className="tab-selector">
          {[
            { key: "todas",     label: "Sin filtro de fecha" },
            { key: "vencidas",  label: "⚠️ Vencidas" },
            { key: "proximas",  label: "⏳ Próximas a vencer" },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${filtroTiempo === key ? "activo" : ""}`}
              onClick={() => setFiltroTiempo(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────────── */}
      {cargando ? (
        <p className="texto-secundario">Cargando facturas...</p>
      ) : facturas.length === 0 ? (
        <div className="estado-vacio">
          <p className="texto-secundario">No hay facturas que coincidan con estos filtros.</p>
        </div>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Vence</th>
                <th className="th-num">Total</th>
                <th className="th-num">Pagado</th>
                <th className="th-num">Pendiente</th>
                <th>Estado</th>
                <th className="th-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map(f => {
                const vencida = f.estado !== "pagada" && f.fecha_venc < new Date().toISOString().split("T")[0];
                return (
                  <tr key={f.id} style={vencida ? { background: "rgba(239,68,68,0.06)" } : {}}>
                    <td className="td-nombre" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}>{f.numero}</td>
                    <td>{f.proveedor_nombre}</td>
                    <td style={{ fontSize: "0.8rem" }}>{f.fecha}</td>
                    <td style={{ fontSize: "0.8rem", color: vencida ? "var(--red)" : "inherit", fontWeight: vencida ? 600 : 400 }}>
                      {f.fecha_venc} {vencida && "⚠️"}
                    </td>
                    <td className="td-num">{COP(f.valor_total)}</td>
                    <td className="td-num" style={{ color: "var(--green)" }}>{COP(f.valor_pagado)}</td>
                    <td className="td-num td-monto">{COP(f.valor_pendiente)}</td>
                    <td>
                      <span className={`chip ${colorEstadoFactura(f.estado)}`}>{etiquetaEstadoFactura(f.estado)}</span>
                    </td>
                    <td className="td-center">
                      {f.estado !== "pagada" ? (
                        <button className="btn-secundario" style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}
                          onClick={() => abrirPago(f)}>
                          💳 Pagar
                        </button>
                      ) : (
                        <span className="texto-muted" style={{ fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

     {/* ── MODAL: NUEVA FACTURA ────────────────────────────── */}
{modalCrear && (
  <div
    className="modal-overlay"
    onClick={() => setModalCrear(false)}
  >
    <div
      className="modal-box"
      style={{
        maxWidth: "480px",
        width: "100%",
        maxHeight: "calc(100vh - 80px)",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: "auto",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-header modal-header-normal"
        style={{ flexShrink: 0 }}
      >
        <span className="modal-titulo">
          Nueva factura de proveedor
        </span>

        <button
          className="modal-cerrar"
          onClick={() => setModalCrear(false)}
        >
          ✕
        </button>
      </div>

      <div
        className="modal-body"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto"
        }}
      >
        {errores.length > 0 && (
          <div
            className="alerta-error"
            style={{ marginBottom: "0.75rem" }}
          >
            {errores.map((e, i) => (
              <p key={i}>• {e}</p>
            ))}
          </div>
        )}

        <div className="campo-grupo">
          <label className="campo-label">
            Número de factura *
          </label>

          <input
            className="campo-input"
            autoFocus
            placeholder="Ej: F-001245"
            value={form.numero}
            onChange={(e) =>
              setForm({ ...form, numero: e.target.value })
            }
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label">
            Proveedor *
          </label>

          <select
            className="campo-input"
            value={form.proveedor_id}
            onChange={(e) =>
              setForm({
                ...form,
                proveedor_id: e.target.value
              })
            }
          >
            <option value="">
              Selecciona un proveedor
            </option>

            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          {proveedores.length === 0 && (
            <p
              className="texto-muted"
              style={{
                fontSize: "0.75rem",
                marginTop: "0.25rem"
              }}
            >
              No hay proveedores activos — crea uno primero en la sección
              Proveedores.
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem"
          }}
        >
          <div className="campo-grupo">
            <label className="campo-label">
              Fecha *
            </label>

            <input
              className="campo-input"
              type="date"
              value={form.fecha}
              onChange={(e) =>
                setForm({
                  ...form,
                  fecha: e.target.value
                })
              }
            />
          </div>

          <div className="campo-grupo">
            <label className="campo-label">
              Fecha de vencimiento *
            </label>

            <input
              className="campo-input"
              type="date"
              value={form.fecha_venc}
              onChange={(e) =>
                setForm({
                  ...form,
                  fecha_venc: e.target.value
                })
              }
            />
          </div>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">
            Valor total (COP) *
          </label>

          <input
            className="campo-input"
            type="number"
            min="0"
            placeholder="0"
            value={form.valor_total}
            onChange={(e) =>
              setForm({
                ...form,
                valor_total: e.target.value
              })
            }
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label">
            Observaciones
          </label>

          <input
            className="campo-input"
            placeholder="Opcional"
            value={form.observaciones}
            onChange={(e) =>
              setForm({
                ...form,
                observaciones: e.target.value
              })
            }
          />
        </div>
      </div>

      <div
        className="modal-footer"
        style={{ flexShrink: 0 }}
      >
        <button
          className="btn-ghost"
          onClick={() => setModalCrear(false)}
        >
          Cancelar
        </button>

        <button
          className="btn-primario"
          onClick={handleCrearFactura}
          disabled={procesando}
        >
          {procesando
            ? "Guardando..."
            : "Registrar factura"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── MODAL: REGISTRAR PAGO ───────────────────────────── */}
      {modalPago && (
        <div className="modal-overlay" onClick={() => setModalPago(null)}>
          <div className="modal-box" style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal" style={{ flexShrink: 0 }}>
              <span className="modal-titulo">Registrar pago</span>
              <button className="modal-cerrar" onClick={() => setModalPago(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
                Factura <strong style={{ color: "var(--text-1)" }}>{modalPago.numero}</strong> — {modalPago.proveedor_nombre}
                <br />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85rem" }}>
                  Pendiente: <strong style={{ color: "var(--red)" }}>{COP(modalPago.valor_pendiente)}</strong>
                </span>
              </p>

              <div className="campo-grupo">
                <label className="campo-label">Monto a pagar</label>
                <input className="campo-input" type="number" min="0" step="0.01" autoFocus
                  placeholder="0" value={montoPago} onChange={e => setMontoPago(e.target.value)} />
              </div>

              <div className="campo-grupo">
                <label className="campo-label">Método de pago</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {METODOS_PAGO.map(m => (
                    <button key={m} type="button"
                      className={`btn-rol ${metodoPago === m ? "activo" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setMetodoPago(m)}>
                      {ICONO_METODO[m]} {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="campo-grupo">
                <label className="campo-label">Observaciones (opcional)</label>
                <input className="campo-input" placeholder="Ej: Abono parcial"
                  value={obsPago} onChange={e => setObsPago(e.target.value)} />
              </div>

              {montoPago && Number(montoPago) > 0 && (
                <div style={{
                  padding: "0.6rem 0.9rem", borderRadius: "var(--r-sm)",
                  background: "var(--green-dim)", border: "1px solid var(--green-border)",
                  fontSize: "0.82rem", color: "var(--green)",
                }}>
                  Quedará pendiente: {COP(Math.max(0, modalPago.valor_pendiente - Number(montoPago)))}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button className="btn-ghost" onClick={() => setModalPago(null)}>Cancelar</button>
              <button className="btn-primario" onClick={handleRegistrarPago} disabled={procesando}>
                {procesando ? "Registrando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasPorPagar;