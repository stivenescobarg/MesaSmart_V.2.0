// frontend/src/components/admin/Caja.jsx
// Componente encargado de administrar el estado de la caja.
// Permite:
// - Abrir caja con un monto inicial.
// - Mostrar métricas de ventas.
// - Activar o pausar el servicio de pedidos.
// - Cerrar caja y descargar automáticamente el reporte PDF.
// - Visualizar las últimas ventas registradas.

import { useState } from "react";

// Función para formatear números en pesos colombianos.
// Ejemplo: 15000 -> $15.000
const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// Función encargada de descargar el PDF en base64
// que devuelve el backend al cerrar caja.
const descargarPDF = (base64) => {

  // Convierte el base64 en un archivo tipo Blob PDF
  const blob = new Blob(
    [Uint8Array.from(atob(base64), c => c.charCodeAt(0))],
    { type: "application/pdf" }
  );

  // Crea una URL temporal para el archivo
  const url  = URL.createObjectURL(blob);

  // Crea dinámicamente un enlace para forzar la descarga
  const link = document.createElement("a");
  link.href  = url;

  // Nombre automático del archivo con la fecha actual
  link.download = `cierre-caja-${new Date().toISOString().split("T")[0]}.pdf`;

  // Simula un clic para descargar el PDF
  link.click();

  // Libera memoria eliminando la URL temporal
  URL.revokeObjectURL(url);
};

// Componente principal Caja
const Caja = ({ 
  cajaAbierta, 
  caja, 
  servicioActivo, 
  onAbrirCaja, 
  onCerrarCaja, 
  onToggleServicio 
}) => {

  // Estado para almacenar el monto ingresado
  const [montoInput, setMontoInput] = useState("");

  // Estado para mostrar confirmación antes de cerrar caja
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  // Estado para indicar carga mientras se genera el PDF
  const [cerrando, setCerrando] = useState(false);

  // Función para abrir la caja
  const handleAbrirCaja = () => {

    // Convierte el texto ingresado a número
    const monto = parseFloat(
      montoInput.replace(/\./g, "").replace(",", ".")
    );

    // Valida que el monto sea válido
    if (isNaN(monto) || monto < 0) return;

    // Ejecuta función enviada desde el componente padre
    onAbrirCaja(monto);

    // Limpia el input después de abrir caja
    setMontoInput("");
  };

  // Función para cerrar la caja
  const handleCerrarCaja = async () => {

    // Activa estado de carga
    setCerrando(true);

    try {

      // Llama función del padre y espera la respuesta
      const resultado = await onCerrarCaja();

      // Si el backend devuelve un PDF, lo descarga
      if (resultado?.pdf) {
        descargarPDF(resultado.pdf);
      }

    } finally {

      // Restablece estados
      setCerrando(false);
      setConfirmandoCierre(false);
    }
  };

  // Obtiene el monto inicial de la caja
  const montoInicial = parseFloat(caja?.monto_inicial ?? 0) || 0;

  // Lista de ventas registradas
  const ventas = caja?.ventas ?? [];

  // Calcula el total vendido sumando todas las ventas
  const totalVendido = ventas.reduce(
    (acc, v) => acc + (parseFloat(v.total) || 0),
    0
  );

  // Formatea la hora de apertura
  const horaApertura = caja?.apertura
    ? new Date(caja.apertura).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "—";

  return (
    <div className="seccion-container">

      {/* Encabezado */}
      <div className="seccion-header">

        <h2 className="seccion-titulo">
          Estado de Caja
        </h2>

        {/* Estado visual de la caja */}
        <span className={`chip ${cajaAbierta ? "chip-verde" : "chip-rojo"}`}>
          {cajaAbierta ? "Abierta" : "Cerrada"}
        </span>
      </div>

      {/* ============================ */}
      {/* CAJA CERRADA */}
      {/* ============================ */}

      {!cajaAbierta ? (

        <div className="admin-card caja-card">

          <p className="caja-descripcion">
            Ingresa el monto en caja al iniciar la jornada 
            para comenzar a registrar ventas.
          </p>

          {/* Campo para monto inicial */}
          <div className="campo-grupo">

            <label className="campo-label">
              Monto inicial en caja
            </label>

            <div className="input-prefijo">

              <span className="prefijo">$</span>

              <input
                className="campo-input"
                type="number"
                min="0"
                placeholder="0"
                value={montoInput}

                // Actualiza el estado al escribir
                onChange={(e) => setMontoInput(e.target.value)}

                // Permite abrir caja con Enter
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAbrirCaja()
                }
              />
            </div>
          </div>

          {/* Botón abrir caja */}
          <button
            className="btn-primario btn-ancho"
            onClick={handleAbrirCaja}

            // Deshabilita si el monto es inválido
            disabled={!montoInput || parseFloat(montoInput) < 0}
          >
            Abrir caja — Iniciar jornada
          </button>
        </div>

      ) : (

        /* ============================ */
        /* CAJA ABIERTA */
        /* ============================ */

        <div className="caja-abierta-grid">

          {/* Hora de apertura */}
          <div className="admin-card">
            <p className="metrica-etiqueta">Hora de apertura</p>
            <p className="metrica-valor">{horaApertura}</p>
          </div>

          {/* Monto inicial */}
          <div className="admin-card">
            <p className="metrica-etiqueta">Monto inicial</p>
            <p className="metrica-valor">
              {COP(montoInicial)}
            </p>
          </div>

          {/* Total vendido */}
          <div className="admin-card">
            <p className="metrica-etiqueta">Total vendido</p>
            <p className="metrica-valor metrica-amber">
              {COP(totalVendido)}
            </p>
          </div>

          {/* Cantidad de ventas */}
          <div className="admin-card">
            <p className="metrica-etiqueta">
              Ventas registradas
            </p>
            <p className="metrica-valor">
              {ventas.length}
            </p>
          </div>

          {/* ============================ */}
          {/* CONTROL DEL SERVICIO */}
          {/* ============================ */}

          <div className="admin-card caja-acciones-card">

            <h3 className="subtitulo">
              Control de servicio
            </h3>

            <p className="texto-secundario">
              Activa o desactiva el servicio 
              para pedidos vía QR.
            </p>

            <button
              className={
                servicioActivo
                  ? "btn-secundario"
                  : "btn-primario"
              }

              onClick={onToggleServicio}
            >
              {servicioActivo
                ? "⏸ Pausar servicio"
                : "▶ Activar servicio"}
            </button>
          </div>

          {/* ============================ */}
          {/* CIERRE DE CAJA */}
          {/* ============================ */}

          <div className="admin-card caja-acciones-card">

            <h3 className="subtitulo">
              Cierre de jornada
            </h3>

            <p className="texto-secundario">
              Al cerrar se generará un{" "}
              <strong>reporte PDF</strong> automáticamente.
            </p>

            {/* Botón inicial */}
            {!confirmandoCierre ? (

              <button
                className="btn-peligro"
                onClick={() => setConfirmandoCierre(true)}
              >
                🔒 Cerrar caja
              </button>

            ) : (

              // Confirmación antes de cerrar
              <div className="confirm-box">

                <p>
                  ¿Confirmas el cierre? 
                  Se descargará el reporte PDF.
                </p>

                <div className="confirm-botones">

                  {/* Confirmar cierre */}
                  <button
                    className="btn-peligro"
                    onClick={handleCerrarCaja}
                    disabled={cerrando}
                  >
                    {cerrando
                      ? "Generando PDF..."
                      : "✓ Sí, cerrar y descargar PDF"}
                  </button>

                  {/* Cancelar cierre */}
                  <button
                    className="btn-ghost"
                    onClick={() => setConfirmandoCierre(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================ */}
          {/* ÚLTIMAS VENTAS */}
          {/* ============================ */}

          {ventas.length > 0 && (

            <div className="admin-card caja-ventas-recientes">

              <h3 className="subtitulo">
                Ventas de esta sesión
              </h3>

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

                  {/* Muestra las últimas 8 ventas */}
                  {[...ventas]
                    .reverse()
                    .slice(0, 8)
                    .map((v, i) => (

                    <tr key={v.id ?? i}>

                      {/* Nombre de mesa */}
                      <td>{v.mesa_nombre ?? "—"}</td>

                      {/* Hora */}
                      <td>{v.hora ?? "—"}</td>

                      {/* Método de pago */}
                      <td>
                        <span
                          className={`chip chip-metodo chip-${(
                            v.metodo_pago ?? ""
                          ).toLowerCase()}`}
                        >
                          {v.metodo_pago ?? "—"}
                        </span>
                      </td>

                      {/* Total de la venta */}
                      <td className="td-monto">
                        {COP(v.total)}
                      </td>
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

// Exporta el componente para ser usado en otras vistas
export default Caja;