// ══════════════════════════════════════════════════════════════════
// ToastContainer.jsx — Renderiza los toasts en pantalla
// ══════════════════════════════════════════════════════════════════

const ICONOS = {
  exito:       "✓",
  error:       "✕",
  advertencia: "⚠",
  info:        "i",
};

/**
 * @param {{ toasts: {id, mensaje, tipo}[], remover: fn }} props
 */
const ToastContainer = ({ toasts, remover }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.tipo}`}
          onClick={() => remover(t.id)}
          role="alert"
        >
          <span className="toast-icono">{ICONOS[t.tipo]}</span>
          <span className="toast-mensaje">{t.mensaje}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;