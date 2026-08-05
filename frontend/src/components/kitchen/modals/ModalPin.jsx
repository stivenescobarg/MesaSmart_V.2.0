import { useState } from "react";
import { API_URL } from "../../../services/config";

const API = `${API_URL}/stock`;

// ── Modal PIN ─────────────────────────────────────────────────────
const ModalPin = ({ onConfirmar, onCancelar }) => {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState("");
  const [carg,  setCarg]  = useState(false);
  

  const validar = async () => {
    if (!pin) return;
    setCarg(true);
    try {
      const res  = await fetch(`${API}/cocina/validar-pin`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        onConfirmar(pin);
      } else {
        setError("PIN incorrecto. Intenta de nuevo.");
        setPin("");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCarg(false);
    }
  };

  return (
    <div className="kd-modal-overlay" onClick={onCancelar}>
      <div className="kd-modal" style={{ maxWidth: "340px" }} onClick={e => e.stopPropagation()}>
        <button className="kd-modal-close" onClick={onCancelar}>✕</button>

        <div style={{ padding: "0 0 1rem", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔐</p>
          <h3 style={{ color: "var(--kd-text-primary)", marginBottom: "0.25rem" }}>
            PIN de seguridad
          </h3>
          <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Ingresa el PIN para modificar el inventario
          </p>

          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={e => { setPin(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && validar()}
            placeholder="••••"
            style={{
              width: "100%", padding: "0.75rem 1rem", textAlign: "center",
              fontSize: "1.5rem", letterSpacing: "0.4em",
              background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
              borderRadius: "10px", color: "var(--kd-text-primary)",
              outline: "none", fontFamily: "DM Mono, monospace",
            }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.5rem" }}>
              {error}
            </p>
          )}

          <button
            onClick={validar}
            disabled={!pin || carg}
            style={{
              marginTop: "1rem", width: "100%", padding: "0.75rem",
              background: "#2563eb", color: "white", border: "none",
              borderRadius: "10px", fontSize: "0.9rem", fontWeight: "600",
              cursor: "pointer", opacity: (!pin || carg) ? 0.5 : 1,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {carg ? "Verificando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPin;