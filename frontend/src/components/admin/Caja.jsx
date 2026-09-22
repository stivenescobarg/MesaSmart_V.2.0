// frontend/src/components/admin/Caja.jsx
// Componente encargado de administrar el estado de la caja.
// Permite:
// - Abrir caja con un monto inicial.
// - Mostrar métricas de ventas.
// - Activar o pausar el servicio de pedidos.
// - Cerrar caja y descargar automáticamente el reporte PDF.
// - Visualizar las últimas ventas registradas.
// - Mostrar el desglose de servicio, propinas y descuentos del día.
// - NUEVO: abrir el detalle de una venta y corregirla (VentaDetalleModal).
// - NUEVO: ARQUEO DE EFECTIVO — antes de cerrar la caja se cuenta cuántos
//   billetes y monedas hay de cada denominación; el total se calcula solo,
//   se compara contra el efectivo esperado y viaja al backend para que
//   aparezca en el PDF del cierre.
//
// ACTUALIZACIÓN DE ESTILO (v2): el arqueo ahora se distribuye en 3
// columnas (billetes / monedas / resumen-comparativo), con badges de
// color por denominación y tarjetas destacadas para el total y el
// efectivo esperado. Todo usa las clases de arqueo-styles.css, que a
// su vez usa las variables de tema (--bg, --amber, etc.), así que se
// ve bien tanto en modo oscuro como en html.light-mode.

import { useState } from "react";
import VentaDetalleModal from "./VentaDetalleModal";
import { cajaService } from "../../services/cajaService";

// Función para formatear números en pesos colombianos.
// Ejemplo: 15000 -> $15.000
const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// ─────────────────────────────────────────────────────────────
// ARQUEO — denominaciones del peso colombiano
// ─────────────────────────────────────────────────────────────
const BILLETES = [100000, 50000, 20000, 10000, 5000, 2000];
const MONEDAS  = [1000, 500, 200, 100, 50];

// Un color distinto por fila, solo para que cada denominación sea
// fácil de ubicar de un vistazo (mismos tokens que ya usan los .chip).
const COLORES_BILLETES = ["azul", "morado", "verde", "naranja", "rojo", "amber"];
const COLORES_MONEDAS  = ["morado", "verde", "naranja", "rojo", "azul"];

// Conteo inicial: un campo vacío por cada denominación (clave = valor como texto)
const conteoVacio = () =>
  Object.fromEntries([...BILLETES, ...MONEDAS].map((d) => [String(d), ""]));

// Convierte lo escrito en el input a un entero >= 0
const aEntero = (valor) => Math.max(0, parseInt(valor, 10) || 0);

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

// ─────────────────────────────────────────────────────────────
// Fila de una denominación: [●] [ $50.000 ] [ cantidad ] = [ subtotal ]
// ─────────────────────────────────────────────────────────────
const FilaDenominacion = ({ valor, cantidad, color, onCambiar }) => {
  const n = aEntero(cantidad);
  return (
    <div className="arqueo-fila">
      <span className={`arqueo-fila-badge ${color}`}>$</span>

      <span className="arqueo-fila-valor">{COP(valor)}</span>

      <input
        className="campo-input arqueo-fila-input"
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        placeholder="0"
        value={cantidad}
        aria-label={`Cantidad de ${COP(valor)}`}
        onChange={(e) => onCambiar(valor, e.target.value.replace(/[^\d]/g, ""))}
        onFocus={(e) => e.target.select()}
        // Evita que la rueda del mouse cambie el número sin querer
        onWheel={(e) => e.currentTarget.blur()}
      />

      <span className="arqueo-fila-igual">=</span>

      <span className={`arqueo-fila-subtotal${n > 0 ? " con-valor" : ""}`}>
        {n > 0 ? COP(n * valor) : "—"}
      </span>
    </div>
  );
};

// ── Panel de un grupo (Billetes / Monedas) ──
// Vive AFUERA de ArqueoEfectivo a propósito: si se define adentro, React
// lo recrea en cada tecla y el input pierde el foco después del primer dígito.
const Panel = ({ titulo, icono, badgeClase, lista, colores, conteo, total, onCambiar }) => (
  <div className="arqueo-panel">
    <div className="arqueo-panel-header">
      <span className={`arqueo-badge-grupo ${badgeClase}`}>{icono}</span>
      <h4>{titulo}</h4>
      <span className="arqueo-panel-count">{lista.length} denominaciones</span>
    </div>

    <div className="arqueo-panel-body">
      {lista.map((d, i) => (
        <FilaDenominacion
          key={d}
          valor={d}
          cantidad={conteo[String(d)]}
          color={colores[i]}
          onCambiar={onCambiar}
        />
      ))}
    </div>

    <div className="arqueo-panel-footer">
      <span className={`arqueo-badge-grupo ${badgeClase}`}>{icono}</span>
      <span>Total {titulo.toLowerCase()}</span>
      <strong>{COP(total)}</strong>
    </div>
  </div>
);
// ─────────────────────────────────────────────────────────────
// Panel de conteo de efectivo (se muestra al iniciar el cierre)
// ─────────────────────────────────────────────────────────────
const ArqueoEfectivo = ({ conteo, onCambiar, onLimpiar, esperado }) => {
  const subtotal = (lista) =>
    lista.reduce((acc, d) => acc + d * aEntero(conteo[String(d)]), 0);
  const piezas = (lista) =>
    lista.reduce((acc, d) => acc + aEntero(conteo[String(d)]), 0);

  const totalBilletes = subtotal(BILLETES);
  const totalMonedas  = subtotal(MONEDAS);
  const totalContado  = totalBilletes + totalMonedas;
  const diferencia    = totalContado - esperado.total;
  const hayConteo     = totalContado > 0;

  const estado =
    diferencia === 0
      ? { texto: "Caja cuadrada", clase: "arqueo-estado-cuadrada", icono: "✓" }
      : diferencia > 0
        ? { texto: "Sobrante", clase: "arqueo-estado-sobrante", icono: "▲" }
        : { texto: "Faltante", clase: "arqueo-estado-faltante", icono: "▼" };



  return (
    <div className="arqueo">

      {/* Encabezado */}
      <div className="arqueo-header">
        <div className="arqueo-header-info">
          <span className="arqueo-header-icono">🧾</span>
          <div>
            <p className="arqueo-header-titulo">Arqueo de caja</p>
            <p className="arqueo-header-sub">
              Cuenta el efectivo que hay en la caja y verifica que cuadre con las ventas del día.
            </p>
          </div>
        </div>

        <button type="button" className="btn-ghost" onClick={onLimpiar} disabled={!hayConteo}>
          Limpiar conteo
        </button>
      </div>

      {/* Banner informativo */}
      <div className="alerta-info arqueo-banner">
        <span>ℹ️</span>
        <span>Escribe cuántos billetes y monedas hay de cada valor. El total se calcula automáticamente.</span>
      </div>

      {/* Billetes / monedas / resumen */}
      <div className="arqueo-layout">

        <Panel
          titulo="Billetes"
          icono="💵"
          badgeClase="arqueo-badge-grupo-billetes"
          lista={BILLETES}
          colores={COLORES_BILLETES}
          conteo={conteo}
          onCambiar={onCambiar}
          total={totalBilletes}
        />

        <Panel
          titulo="Monedas"
          icono="🪙"
          badgeClase="arqueo-badge-grupo-monedas"
          lista={MONEDAS}
          colores={COLORES_MONEDAS}
          conteo={conteo}
          onCambiar={onCambiar}
          total={totalMonedas}
        />

        <div className="arqueo-col-resumen">

          {/* Resumen del conteo */}
          <div className="arqueo-card">
            <p className="arqueo-card-titulo">
              <span className="icono">📋</span> Resumen del arqueo
            </p>

            <div className="arqueo-linea">
              <span className="label">💵 Total billetes</span>
              <span className="valor-mono">{COP(totalBilletes)}</span>
            </div>
            <div className="arqueo-linea">
              <span className="label">🪙 Total monedas</span>
              <span className="valor-mono">{COP(totalMonedas)}</span>
            </div>

            <div className="arqueo-destacado">
              <span className="label">💰 Total efectivo contado</span>
              <span className="valor-mono">{COP(totalContado)}</span>
            </div>
          </div>

          {/* Comparativo contra lo esperado */}
          <div className="arqueo-card">
            <p className="arqueo-card-titulo">
              <span className="icono">⚖️</span> Comparativo
            </p>

            <div className="arqueo-linea">
              <span className="label">💳 Monto inicial</span>
              <span className="valor-mono">{COP(esperado.montoInicial)}</span>
            </div>
            <div className="arqueo-linea">
              <span className="label">📈 + Efectivo cobrado en ventas</span>
              <span className="valor-mono">{COP(esperado.efectivoVentas)}</span>
            </div>
            <div className="arqueo-linea">
              <span className="label">➖ Egresos</span>
              <span className="valor-mono">{COP(esperado.totalEgresos)}</span>
            </div>

            <div className="arqueo-destacado">
              <span className="label">🎯 Efectivo esperado</span>
              <span className="valor-mono">{COP(esperado.total)}</span>
            </div>

            {hayConteo ? (
              <div className={`arqueo-estado ${estado.clase}`}>
                <span>{estado.icono} {estado.texto}</span>
                <span className="valor-mono">
                  {diferencia > 0 ? "+" : diferencia < 0 ? "−" : ""}{COP(Math.abs(diferencia))}
                </span>
              </div>
            ) : (
              <p className="arqueo-hint">
                <span>ℹ️</span> Empieza a contar para ver si la caja cuadra.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente principal Caja
const Caja = ({ 
  cajaAbierta, 
  caja, 
  servicioActivo, 
  onAbrirCaja, 
  onCerrarCaja, 
  onToggleServicio,
  onCajaActualizada, // NUEVO: callback opcional del padre para refrescar el estado de caja tras editar una venta
}) => {

  // Estado para almacenar el monto ingresado
  const [montoInput, setMontoInput] = useState("");

  // Estado para mostrar confirmación antes de cerrar caja
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  // Estado para indicar carga mientras se genera el PDF
  const [cerrando, setCerrando] = useState(false);

  // NUEVO: venta actualmente abierta en el modal de detalle/edición (null = cerrado)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // NUEVO — ARQUEO: cantidades escritas por denominación y opción de omitir el conteo
  const [conteo, setConteo] = useState(conteoVacio);
  const [omitirConteo, setOmitirConteo] = useState(false);

  const handleCambioConteo = (valor, cantidad) =>
    setConteo((prev) => ({ ...prev, [String(valor)]: cantidad }));

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

      // NUEVO: si hay conteo, se envía como argumento a onCerrarCaja para que
      // el padre lo reenvíe al backend. Solo se mandan las CANTIDADES; los
      // totales los recalcula el servidor.
      const arqueo = omitirConteo
        ? null
        : {
            conteo: Object.fromEntries(
              [...BILLETES, ...MONEDAS].map((d) => [String(d), aEntero(conteo[String(d)])])
            ),
          };

      // Llama función del padre y espera la respuesta
      const resultado = await onCerrarCaja(arqueo);

      // Si el backend devuelve un PDF, lo descarga
      if (resultado?.pdf) {
        descargarPDF(resultado.pdf);
      }

      // Cierre exitoso (el padre devuelve null si falló): se limpia el conteo
      // para la próxima jornada. Si falló, se conserva para no tener que recontar.
      if (resultado) {
        setConteo(conteoVacio());
        setOmitirConteo(false);
      }

    } finally {

      // Restablece estados
      setCerrando(false);
      setConfirmandoCierre(false);
    }
  };

  // NUEVO: abre el modal de detalle/edición para una venta puntual
const abrirEdicion = async (venta_id) => {
  try {
    const respuesta = await cajaService.getVentaDetalle(venta_id);
    setVentaSeleccionada(respuesta.venta);
  } catch (err) {
    console.error("[abrirEdicion]", err);
  }
};

  // NUEVO: se llama cuando VentaDetalleModal guarda una corrección con éxito
  const handleVentaGuardada = () => {
    setVentaSeleccionada(null);
    onCajaActualizada?.(); // el padre decide cómo refrescar (ej. volver a llamar getEstado)
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

  // Desglose de servicio / propinas / descuentos del día.
  const totalServicio  = ventas.reduce((acc, v) => acc + (parseFloat(v.servicio)  || 0), 0);
  const totalPropinas  = ventas.reduce((acc, v) => acc + (parseFloat(v.propina)   || 0), 0);
  const totalDescuentos = ventas.reduce((acc, v) => acc + (parseFloat(v.descuento) || 0), 0);

  // NUEVO — ARQUEO: efectivo esperado en caja = monto inicial + efectivo cobrado − egresos.
  // El efectivo se toma del desglose de pagos de cada venta (así las ventas de
  // pago mixto aportan solo su parte en efectivo); si una venta no trae
  // desglose, se usa su método de pago único.
  const efectivoVentas = ventas.reduce((acc, v) => {
    if (Array.isArray(v.pagos) && v.pagos.length) {
      return acc + v.pagos
        .filter((p) => String(p.metodo_pago).toLowerCase() === "efectivo")
        .reduce((a, p) => a + (parseFloat(p.monto) || 0), 0);
    }
    return acc + (String(v.metodo_pago ?? "").toLowerCase() === "efectivo" ? (parseFloat(v.total) || 0) : 0);
  }, 0);

  const totalEgresos = (caja?.egresos ?? []).reduce(
    (acc, e) => acc + (parseFloat(e.monto) || 0),
    0
  );

  const esperadoEfectivo = {
    montoInicial,
    efectivoVentas,
    totalEgresos,
    total: montoInicial + efectivoVentas - totalEgresos,
  };

  // Formatea la hora de apertura
  const horaApertura = caja?.apertura
    ? new Date(caja.apertura).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Bogota"
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
          {/* DESGLOSE SERVICIO / PROPINAS / DESCUENTOS */}
          {/* ============================ */}

          <div className="admin-card">
            <p className="metrica-etiqueta">Servicio acumulado</p>
            <p className="metrica-valor">{COP(totalServicio)}</p>
          </div>

          <div className="admin-card">
            <p className="metrica-etiqueta">Propinas acumuladas</p>
            <p className="metrica-valor">{COP(totalPropinas)}</p>
          </div>

          <div className="admin-card">
            <p className="metrica-etiqueta">Descuentos aplicados</p>
            <p className="metrica-valor">{COP(totalDescuentos)}</p>
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

          {/* Al iniciar el cierre la tarjeta ocupa todo el ancho para que quepa el conteo de efectivo */}
          <div
            className="admin-card caja-acciones-card"
            style={confirmandoCierre ? { gridColumn: "1 / -1" } : undefined}
          >

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
                onClick={() => {
                  setConfirmandoCierre(true);
                  // Refresca la caja para que el efectivo esperado incluya
                  // las últimas ventas y egresos antes de contar.
                  onCajaActualizada?.();
                }}
              >
                🔒 Cerrar caja
              </button>

            ) : (

              // Confirmación antes de cerrar
              <div className="confirm-box">

                {/* NUEVO: conteo de billetes y monedas antes de cerrar */}
                <label className="arqueo-toggle">
                  <input
                    type="checkbox"
                    checked={omitirConteo}
                    onChange={(e) => setOmitirConteo(e.target.checked)}
                    disabled={cerrando}
                  />
                  Cerrar sin conteo de efectivo
                </label>

                {!omitirConteo && (
                  <ArqueoEfectivo
                    conteo={conteo}
                    onCambiar={handleCambioConteo}
                    onLimpiar={() => setConteo(conteoVacio())}
                    esperado={esperadoEfectivo}
                  />
                )}

                <p style={{ marginTop: "0.85rem" }}>
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
                    disabled={cerrando}
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

              <p className="texto-muted" style={{ marginBottom: "0.5rem", fontSize: "0.78rem" }}>
                Haz clic en una venta para ver el detalle o corregirla →
              </p>

              <table className="tabla">

                <thead>
                  <tr>
                    <th>Mesa</th>
                    <th>Hora</th>
                    <th>Método</th>
                    {/* columna servicio/propina para trazabilidad visual */}
                    <th>Servicio</th>
                    <th>Propina</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>

                  {/* Muestra las últimas 8 ventas */}
                  {[...ventas]
                    .reverse()
                    .slice(0, 8)
                    .map((v, i) => (

                    <tr
                      key={v.id ?? i}
                      onClick={() => v.id && abrirEdicion(v.id)}
                      style={{ cursor: v.id ? "pointer" : "default" }}
                    >

                      {/* Nombre de mesa (o subcuenta, si aplica) */}
                      <td>
                        {v.mesa_nombre ?? "—"}
                        {v.subcuenta_nombre ? ` · ${v.subcuenta_nombre}` : ""}
                      </td>

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

                      {/* Servicio */}
                      <td className="td-monto">{COP(v.servicio || 0)}</td>

                      {/* Propina */}
                      <td className="td-monto">{COP(v.propina || 0)}</td>

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

      {/* ============================ */}
      {/* MODAL DE DETALLE / EDICIÓN DE VENTA */}
      {/* ============================ */}

      {ventaSeleccionada && (
        <VentaDetalleModal
          venta={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          onGuardado={handleVentaGuardada}
        />
      )}
    </div>
  );
};

// Exporta el componente para ser usado en otras vistas
export default Caja;