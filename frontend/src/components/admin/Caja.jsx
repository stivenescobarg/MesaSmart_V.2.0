// frontend/src/components/admin/Caja.jsx
// Con descarga automática del PDF al cerrar caja

import { useState } from "react";

const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// Descarga el PDF base64 que devuelve el backend
const descargarPDF = (base64) => {
  const blob = new Blob(
    [Uint8Array.from(atob(base64), c => c.charCodeAt(0))],
    { type: "application/pdf" }
  );
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.download = `cierre-caja-${new Date().toISOString().split("T")[0]}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

const Caja = ({ cajaAbierta, caja, servicioActivo, onAbrirCaja, onCerrarCaja, onToggleServicio }) => {
  const [montoInput,        setMontoInput]        = useState("");
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [cerrando,          setCerrando]          = useState(false);

  const handleAbrirCaja = () => {
    const monto = parseFloat(montoInput.replace(/\./g, "").replace(",", "."));
    if (isNaN(monto) || monto < 0) return;
    onAbrirCaja(monto);
    setMontoInput("");
  };

  const handleCerrarCaja = async () => {
    setCerrando(true);
    try {
      const resultado = await onCerrarCaja(); // AdminDashboard devuelve la respuesta
      if (resultado?.pdf) {
        descargarPDF(resultado.pdf);
      }
    } finally {
      setCerrando(false);
      setConfirmandoCierre(false);
    }
  };

  const montoInicial = parseFloat(caja?.monto_inicial ?? 0) || 0;
  const ventas       = caja?.ventas ?? [];
  const totalVendido = ventas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

  const horaApertura = caja?.apertura
    ? new Date(caja.apertura).toLocaleTimeString("es-CO", { hour:"2-digit", minute:"2-digit" })
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
        <div className="admin-card caja-card">
          <p className="caja-descripcion">
            Ingresa el monto en caja al iniciar la jornada para comenzar a registrar ventas.
          </p>
          <div className="campo-grupo">
            <label className="campo-label">Monto inicial en caja</label>
            <div className="input-prefijo">
              <span className="prefijo">$</span>
              <input
                className="campo-input" type="number" min="0" placeholder="0"
                value={montoInput}
                onChange={(e) => setMontoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAbrirCaja()}
              />
            </div>
          </div>
          <button
            className="btn-primario btn-ancho" onClick={handleAbrirCaja}
            disabled={!montoInput || parseFloat(montoInput) < 0}
          >
            Abrir caja — Iniciar jornada
          </button>
        </div>
      ) : (
        <div className="caja-abierta-grid">

          <div className="admin-card">
            <p className="metrica-etiqueta">Hora de apertura</p>
            <p className="metrica-valor">{horaApertura}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Monto inicial</p>
            <p className="metrica-valor">{COP(montoInicial)}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Total vendido</p>
            <p className="metrica-valor metrica-amber">{COP(totalVendido)}</p>
          </div>
          <div className="admin-card">
            <p className="metrica-etiqueta">Ventas registradas</p>
            <p className="metrica-valor">{ventas.length}</p>
          </div>

          {/* Control de servicio */}
          <div className="admin-card caja-acciones-card">
            <h3 className="subtitulo">Control de servicio</h3>
            <p className="texto-secundario">
              Activa o desactiva el servicio para pedidos vía QR.
            </p>
            <button
              className={servicioActivo ? "btn-secundario" : "btn-primario"}
              onClick={onToggleServicio}
            >
              {servicioActivo ? "⏸ Pausar servicio" : "▶ Activar servicio"}
            </button>
          </div>

          {/* Cierre */}
          <div className="admin-card caja-acciones-card">
            <h3 className="subtitulo">Cierre de jornada</h3>
            <p className="texto-secundario">
              Al cerrar se generará un <strong>reporte PDF</strong> automáticamente.
            </p>
            {!confirmandoCierre ? (
              <button className="btn-peligro" onClick={() => setConfirmandoCierre(true)}>
                🔒 Cerrar caja
              </button>
            ) : (
              <div className="confirm-box">
                <p>¿Confirmas el cierre? Se descargará el reporte PDF.</p>
                <div className="confirm-botones">
                  <button
                    className="btn-peligro"
                    onClick={handleCerrarCaja}
                    disabled={cerrando}
                  >
                    {cerrando ? "Generando PDF..." : "✓ Sí, cerrar y descargar PDF"}
                  </button>
                  <button className="btn-ghost" onClick={() => setConfirmandoCierre(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Últimas ventas */}
          {ventas.length > 0 && (
            <div className="admin-card caja-ventas-recientes">
              <h3 className="subtitulo">Ventas de esta sesión</h3>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Mesa</th><th>Hora</th><th>Método</th><th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ventas].reverse().slice(0, 8).map((v, i) => (
                    <tr key={v.id ?? i}>
                      <td>{v.mesa_nombre ?? "—"}</td>
                      <td>{v.hora ?? "—"}</td>
                      <td>
                        <span className={`chip chip-metodo chip-${(v.metodo_pago ?? "").toLowerCase()}`}>
                          {v.metodo_pago ?? "—"}
                        </span>
                      </td>
                      <td className="td-monto">{COP(v.total)}</td>
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