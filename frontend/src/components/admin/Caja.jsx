// ══════════════════════════════════════════════════════════════════
// Caja.jsx — Gestión de apertura/cierre de caja y servicio
// ══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { calcularTotalVendido } from "../../services/cajaService";

/**
 * @param {{
 *   cajaAbierta: boolean,
 *   caja: object|null,
 *   servicioActivo: boolean,
 *   onAbrirCaja: fn(montoInicial: number) => void,
 *   onCerrarCaja: fn() => void,
 *   onToggleServicio: fn() => void,
 * }} props
 */
const Caja = ({ cajaAbierta, caja, servicioActivo, onAbrirCaja, onCerrarCaja, onToggleServicio }) => {
  const [montoInput, setMontoInput] = useState("");
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  const handleAbrirCaja = () => {
    const monto = parseFloat(montoInput.replace(/\./g, "").replace(",", "."));
    if (isNaN(monto) || monto < 0) return;
    onAbrirCaja(monto);
    setMontoInput("");
  };

  const totalVendido = calcularTotalVendido(caja);
  const horaApertura = caja?.fechaApertura
    ? new Date(caja.fechaApertura).toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div className="seccion-container">
      <div className="seccion-header">
        <h2 className="seccion-titulo">Estado de Caja</h2>
        <span className={`chip ${cajaAbierta ? "chip-verde" : "chip-rojo"}`}>
          {cajaAbierta ? "Abierta" : "Cerrada"}
        </span>
      </div>

      {!cajaAbierta ? (
        /* ── CAJA CERRADA ── */
        <div className="admin-card caja-card">
          <p className="caja-descripcion">
            Ingresa el monto en caja al iniciar la jornada para comenzar a registrar ventas.
          </p>
          <div className="campo-grupo">
            <label className="campo-label">Monto inicial en caja</label>
            <div className="input-prefijo">
              <span className="prefijo">$</span>
              <input
                className="campo-input"
                type="number"
                min="0"
                placeholder="0"
                value={montoInput}
                onChange={(e) => setMontoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAbrirCaja()}
              />
            </div>
          </div>
          <button
            className="btn-primario btn-ancho"
            onClick={handleAbrirCaja}
            disabled={!montoInput || parseFloat(montoInput) < 0}
          >
            Abrir caja — Iniciar jornada
          </button>
        </div>
      ) : (
        /* ── CAJA ABIERTA ── */
        <div className="caja-abierta-grid">
          {/* Métricas */}
          <div className="admin-card">
            <p className="metrica-etiqueta">Hora de apertura</p>
            <p className="metrica-valor">{horaApertura}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Monto inicial</p>
            <p className="metrica-valor">${caja.montoInicial.toLocaleString("es-CO")}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Total vendido</p>
            <p className="metrica-valor metrica-amber">${totalVendido.toLocaleString("es-CO")}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Ventas registradas</p>
            <p className="metrica-valor">{caja.ventas.length}</p>
          </div>

          {/* Acciones */}
          <div className="admin-card caja-acciones-card">
            <h3 className="subtitulo">Control de servicio</h3>
            <p className="texto-secundario">
              Activa o desactiva el servicio para que los clientes puedan hacer pedidos vía QR.
            </p>
            <button
              className={servicioActivo ? "btn-secundario" : "btn-primario"}
              onClick={onToggleServicio}
            >
              {servicioActivo ? "⏸ Pausar servicio" : "▶ Activar servicio"}
            </button>
          </div>

          <div className="admin-card caja-acciones-card">
            <h3 className="subtitulo">Cierre de jornada</h3>
            <p className="texto-secundario">
              Cierra la caja del día. Se generará un reporte con todas las ventas.
            </p>
            {!confirmandoCierre ? (
              <button className="btn-peligro" onClick={() => setConfirmandoCierre(true)}>
                🔒 Cerrar caja
              </button>
            ) : (
              <div className="confirm-box">
                <p>¿Confirmas el cierre de caja?</p>
                <div className="confirm-botones">
                  <button className="btn-peligro" onClick={() => { onCerrarCaja(); setConfirmandoCierre(false); }}>
                    Sí, cerrar
                  </button>
                  <button className="btn-ghost" onClick={() => setConfirmandoCierre(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Últimas ventas de la sesión */}
          {caja.ventas.length > 0 && (
            <div className="admin-card caja-ventas-recientes">
              <h3 className="subtitulo">Ventas de esta sesión</h3>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Mesa</th>
                    <th>Hora</th>
                    <th>Método</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...caja.ventas].reverse().slice(0, 8).map((v) => (
                    <tr key={v.id}>
                      <td>{v.mesa}</td>
                      <td>{v.hora}</td>
                      <td><span className={`chip chip-metodo chip-${v.metodo.toLowerCase()}`}>{v.metodo}</span></td>
                      <td className="td-monto">${v.total.toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Caja;