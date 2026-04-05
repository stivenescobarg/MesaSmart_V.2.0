// ══════════════════════════════════════════════════════════════════
// Mesas.jsx — Grid de mesas con creación, eliminación y detalle
// ══════════════════════════════════════════════════════════════════

import { useState } from "react";
import DetalleMesa from "./DetalleMesa";

/**
 * @param {{
 *   mesas: object[],
 *   cajaAbierta: boolean,
 *   onCrearMesa: fn(nombre) => void,
 *   onEliminarMesa: fn(id) => void,
 *   onModificarItem: fn(mesa, index, delta) => void,
 *   onPagoTotal: fn(mesa, metodo) => void,
 *   onPagoParcial: fn(mesa, items, metodo) => void,
 * }} props
 */
const Mesas = ({
  mesas,
  cajaAbierta,
  onCrearMesa,
  onEliminarMesa,
  onModificarItem,
  onPagoTotal,
  onPagoParcial,
}) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [nombreNuevaMesa, setNombreNuevaMesa] = useState("");
  const [modoCrear, setModoCrear] = useState(false);
  const [modoEliminar, setModoEliminar] = useState(false);

  const libres   = mesas.filter((m) => !m.ocupada).length;
  const ocupadas = mesas.filter((m) => m.ocupada).length;

  const handleCrear = () => {
    onCrearMesa(nombreNuevaMesa.trim());
    setNombreNuevaMesa("");
    setModoCrear(false);
  };

  // Si hay una mesa seleccionada, mostrar el detalle
  if (mesaSeleccionada) {
    // Sincronizar con la versión más actualizada de la mesa
    const mesaActual = mesas.find((m) => m.id === mesaSeleccionada.id) || mesaSeleccionada;

    return (
      <DetalleMesa
        mesa={mesaActual}
        cajaAbierta={cajaAbierta}
        onModificarItem={(index, delta) => onModificarItem(mesaActual, index, delta)}
        onPagoTotal={(metodo) => {
          onPagoTotal(mesaActual, metodo);
          setMesaSeleccionada(null);
        }}
        onPagoParcial={(items, metodo) => {
          onPagoParcial(mesaActual, items, metodo);
          // Actualizar vista de la mesa si aún tiene pedidos
          const mesaPost = mesas.find((m) => m.id === mesaActual.id);
          if (mesaPost && mesaPost.pedido.length === 0) setMesaSeleccionada(null);
        }}
        onVolver={() => setMesaSeleccionada(null)}
      />
    );
  }

  return (
    <div className="seccion-container">
      {/* ── ENCABEZADO ── */}
      <div className="seccion-header">
        <h2 className="seccion-titulo">Mesas del restaurante</h2>
        <div className="header-stats">
          <span className="chip chip-verde">{libres} libres</span>
          <span className="chip chip-amber">{ocupadas} ocupadas</span>
        </div>
      </div>

      {!cajaAbierta && (
        <div className="alerta-info">
          ⚠️ La caja está cerrada. Los pagos no se podrán registrar.
        </div>
      )}

      {/* ── ACCIONES ── */}
      <div className="mesas-acciones">
        {!modoCrear ? (
          <button className="btn-secundario" onClick={() => setModoCrear(true)}>
            + Nueva mesa
          </button>
        ) : (
          <div className="crear-mesa-form">
            <input
              className="campo-input campo-inline"
              placeholder="Nombre de la mesa (ej: Mesa Bar)"
              value={nombreNuevaMesa}
              onChange={(e) => setNombreNuevaMesa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCrear()}
              autoFocus
            />
            <button className="btn-primario" onClick={handleCrear}>
              Crear
            </button>
            <button className="btn-ghost" onClick={() => setModoCrear(false)}>
              Cancelar
            </button>
          </div>
        )}

        <button
          className={`btn-ghost ${modoEliminar ? "btn-ghost-activo" : ""}`}
          onClick={() => setModoEliminar(!modoEliminar)}
        >
          {modoEliminar ? "Listo" : "✕ Eliminar mesa"}
        </button>
      </div>

      {/* ── GRID DE MESAS ── */}
      <div className="mesas-grid">
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            className={`mesa-card ${mesa.ocupada ? "ocupada" : "libre"} ${modoEliminar ? "modo-eliminar" : ""}`}
            onClick={() => !modoEliminar && setMesaSeleccionada(mesa)}
          >
            {/* Barra de estado superior */}
            <div className={`mesa-barra ${mesa.ocupada ? "barra-amber" : "barra-verde"}`} />

            <div className="mesa-contenido">
              <p className="mesa-nombre">{mesa.nombre}</p>
              <p className="mesa-estado-texto">
                {mesa.ocupada ? `${mesa.pedido?.length || 0} item(s)` : "Libre"}
              </p>
              {mesa.ocupada && (
                <p className="mesa-total">
                  ${(mesa.total || 0).toLocaleString("es-CO")}
                </p>
              )}
            </div>

            {modoEliminar && !mesa.ocupada && (
              <button
                className="btn-eliminar-mesa"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarMesa(mesa.id);
                }}
              >
                ✕
              </button>
            )}

            {modoEliminar && mesa.ocupada && (
              <div className="mesa-bloqueada" title="No puedes eliminar una mesa con pedidos activos">
                🔒
              </div>
            )}
          </div>
        ))}
      </div>

      {mesas.length === 0 && (
        <div className="estado-vacio">
          <p>No hay mesas registradas. Crea la primera mesa.</p>
        </div>
      )}
    </div>
  );
};

export default Mesas;