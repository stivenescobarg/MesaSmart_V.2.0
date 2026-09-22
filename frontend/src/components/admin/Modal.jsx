// ══════════════════════════════════════════════════════════════════
// components/admin/Modal.jsx
// Modal genérico reutilizable (reemplaza todos los confirm/alert).
//
// FIX (este pase): se renderiza con un PORTAL (`createPortal` hacia
// `document.body`) en vez de quedar anidado dentro del árbol de la
// página. Esto es lo mismo que ya se corrigió en el Modal interno de
// DetalleMesa.jsx — si algún contenedor padre tiene `transform`, rompe
// el `position: fixed` de un hijo no-portal y lo desalinea/recorta del
// viewport real. Con el portal, este modal (el que usa
// VentaDetalleModal para "Editar venta") también queda siempre
// centrado y completo, sin importar dónde esté montado.
//
// Además: `ancho` ahora se aplica con `min(ancho, 95vw)` para que en
// pantallas angostas (celular) nunca se desborde, sin necesidad de
// tocar Admin.css.
// ══════════════════════════════════════════════════════════════════

import { createPortal } from "react-dom";

/**
 * @param {{
 *   abierto: boolean,
 *   titulo: string,
 *   children: ReactNode,
 *   onConfirmar?: fn,
 *   onCancelar?: fn,
 *   labelConfirmar?: string,
 *   labelCancelar?: string,
 *   variante?: "peligro" | "normal",
 *   ancho?: string,
 * }} props
 */
const Modal = ({
  abierto,
  titulo,
  children,
  onConfirmar,
  onCancelar,
  labelConfirmar = "Confirmar",
  labelCancelar  = "Cancelar",
  variante       = "normal",
  ancho,
}) => {
  if (!abierto) return null;

  const contenido = (
    <div className="modal-overlay" onClick={onCancelar}>
      <div
        className="modal-box"
        style={{
          maxWidth: ancho ? `min(${ancho}, 95vw)` : undefined,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`modal-header modal-header-${variante}`}>
          <h3 className="modal-titulo">{titulo}</h3>
          {onCancelar && (
            <button className="modal-cerrar" onClick={onCancelar}>✕</button>
          )}
        </div>

        <div className="modal-body" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>

        {(onConfirmar || onCancelar) && (
          <div className="modal-footer">
            {onCancelar && (
              <button className="btn-ghost" onClick={onCancelar}>
                {labelCancelar}
              </button>
            )}
            {onConfirmar && (
              <button
                className={variante === "peligro" ? "btn-peligro" : "btn-primario"}
                onClick={onConfirmar}
              >
                {labelConfirmar}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(contenido, document.body);
};

export default Modal;