// ══════════════════════════════════════════════════════════════════
// components/admin/Modal.jsx
// Modal genérico reutilizable (reemplaza todos los confirm/alert).
// ══════════════════════════════════════════════════════════════════

/**
 * @param {{
 *   abierto: boolean,
 *   titulo: string,
 *   children: ReactNode,
 *   onConfirmar?: fn,
 *   onCancelar?: fn,
 *   labelConfirmar?: string,
 *   labelCancelar?: string,
 *   variante?: "peligro" | "normal"
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
}) => {
  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div
        className="modal-box"
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

        <div className="modal-body">{children}</div>

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
};

export default Modal;