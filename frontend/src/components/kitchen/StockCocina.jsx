// frontend/src/components/kitchen/StockCocina.jsx
// Solo productos de COCINA. PIN requerido para modificar.

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:3001/api/stock";

const COLOR_NIVEL = (p) => {
  const pct = p.cantidad_actual / Math.max(p.cantidad_minima, 1);
  if (pct <= 0)   return { color: "#ef4444", label: "Agotado", emoji: "🔴" };
  if (pct <= 1)   return { color: "#ef4444", label: "Bajo",    emoji: "⚠️" };
  if (pct <= 1.5) return { color: "#f59e0b", label: "Medio",   emoji: "⚡" };
  return           { color: "#22c55e", label: "OK",     emoji: "✅" };
};

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
        <div className="kd-modal-handle" />
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

// ── Modal ingreso/ajuste ──────────────────────────────────────────
const ModalMovimiento = ({ producto, tipo, pinActivo, onConfirmar, onCancelar }) => {
  const [cantidad,    setCantidad]    = useState(
    tipo === "ajuste" ? String(producto.cantidad_actual) : ""
  );
  const [observacion, setObservacion] = useState("");
  const [carg,        setCarg]        = useState(false);
  const [error,       setError]       = useState("");

  const enviar = async () => {
    const cant = parseFloat(cantidad);
    if (!cant && cant !== 0) { setError("Cantidad inválida."); return; }
    if (cant < 0) { setError("La cantidad no puede ser negativa."); return; }

    setCarg(true);
    try {
      const res = await fetch(`${API}/cocina/movimiento`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pin: pinActivo,
          producto_id: producto.id,
          tipo,
          cantidad: cant,
          observacion,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onConfirmar();
      } else {
        setError(data.msg || "Error al registrar.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCarg(false);
    }
  };

  const nuevoStock = tipo === "ingreso"
    ? (parseFloat(producto.cantidad_actual) + (parseFloat(cantidad) || 0))
    : parseFloat(cantidad) || 0;

  return (
    <div className="kd-modal-overlay" onClick={onCancelar}>
      <div className="kd-modal" style={{ maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
        <div className="kd-modal-handle" />
        <button className="kd-modal-close" onClick={onCancelar}>✕</button>

        <h3 style={{ color: "var(--kd-text-primary)", marginBottom: "0.25rem" }}>
          {tipo === "ingreso" ? "➕ Registrar ingreso" : "✏️ Ajustar stock"}
        </h3>
        <p style={{ color: "#2563eb", fontWeight: "600", marginBottom: "1rem" }}>
          {producto.nombre}
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
            {tipo === "ingreso"
              ? `Cantidad a agregar (${producto.unidad})`
              : `Nueva cantidad total (${producto.unidad})`}
          </p>
          <input
            type="number" min="0" step="0.1" autoFocus
            value={cantidad}
            onChange={e => { setCantidad(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && enviar()}
            style={{
              width: "100%", padding: "0.7rem 1rem",
              background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
              borderRadius: "8px", color: "var(--kd-text-primary)",
              fontSize: "1.1rem", fontFamily: "DM Mono, monospace", outline: "none",
            }}
          />
        </div>

        {cantidad && (
          <div style={{
            padding: "0.6rem 0.9rem", borderRadius: "8px",
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)",
            color: "#60a5fa", fontSize: "0.82rem", marginBottom: "1rem",
          }}>
            Stock resultante: <strong>{nuevoStock.toFixed(2)} {producto.unidad}</strong>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
            Observación (opcional)
          </p>
          <input
            type="text"
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="Ej: Entrega proveedor, conteo físico..."
            style={{
              width: "100%", padding: "0.65rem 1rem",
              background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
              borderRadius: "8px", color: "var(--kd-text-primary)",
              fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onCancelar} style={{
            flex: 1, padding: "0.7rem", background: "var(--kd-bg-elevated)",
            border: "1px solid var(--kd-border)", borderRadius: "8px",
            color: "var(--kd-text-secondary)", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}>
            Cancelar
          </button>
          <button onClick={enviar} disabled={carg} style={{
            flex: 2, padding: "0.7rem", background: "#2563eb",
            border: "none", borderRadius: "8px",
            color: "white", fontWeight: "600", cursor: "pointer",
            opacity: carg ? 0.6 : 1, fontFamily: "DM Sans, sans-serif",
          }}>
            {carg ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal StockCocina ─────────────────────────────
const StockCocina = () => {
  const [productos,  setProductos]  = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [busqueda,   setBusqueda]   = useState("");
  const [pinActivo,  setPinActivo]  = useState(null); // PIN validado en sesión
  const [pinExpira,  setPinExpira]  = useState(null); // timestamp expiry (10 min)
  const [showPin,    setShowPin]    = useState(false);
  const [accion,     setAccion]     = useState(null); // { producto, tipo }
  const [toast,      setToast]      = useState("");

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/cocina/productos`);
      const data = await res.json();
      setProductos(data.productos || []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 15000); // sincronizar con admin cada 15s
    return () => clearInterval(id);
  }, [cargar]);

  // PIN expira a los 10 minutos de inactividad
  const pinEsValido = () => {
    if (!pinActivo || !pinExpira) return false;
    return Date.now() < pinExpira;
  };

  const handleAccion = (producto, tipo) => {
    if (pinEsValido()) {
      setAccion({ producto, tipo });
    } else {
      setPinActivo(null);
      setShowPin(true);
      // Guardar acción pendiente
      setAccion({ producto, tipo, pendiente: true });
    }
  };

  const handlePinConfirmado = (pin) => {
    setPinActivo(pin);
    setPinExpira(Date.now() + 10 * 60 * 1000); // 10 min
    setShowPin(false);
    // Si había acción pendiente, ejecutarla
    if (accion?.pendiente) {
      setAccion({ ...accion, pendiente: false });
    }
  };

  const handleMovimientoConfirmado = () => {
    setAccion(null);
    cargar();
    // Resetear timer del PIN
    setPinExpira(Date.now() + 10 * 60 * 1000);
    mostrarToast("✓ Stock actualizado correctamente");
  };

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const productosFiltrados = productos.filter(p =>
    !busqueda ||
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.proveedor.toLowerCase().includes(busqueda.toLowerCase())
  );

  const bajoStock = productos.filter(p => p.bajo_stock);

  return (
    <div>
      {/* Toast */}
      {toast && <div className="kd-alerta">{toast}</div>}

      {/* Modal PIN */}
      {showPin && (
        <ModalPin
          onConfirmar={handlePinConfirmado}
          onCancelar={() => { setShowPin(false); setAccion(null); }}
        />
      )}

      {/* Modal movimiento */}
      {accion && !accion.pendiente && (
        <ModalMovimiento
          producto={accion.producto}
          tipo={accion.tipo}
          pinActivo={pinActivo}
          onConfirmar={handleMovimientoConfirmado}
          onCancelar={() => setAccion(null)}
        />
      )}

      {/* Header sección */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ color: "var(--kd-text-primary)", fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
              📦 Stock de cocina
            </h2>
            <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.8rem", margin: "0.15rem 0 0" }}>
              {pinEsValido() ? "🔓 Modo edición activo" : "🔒 PIN requerido para editar"}
            </p>
          </div>
          {pinEsValido() && (
            <div style={{
              padding: "0.25rem 0.75rem", borderRadius: "99px",
              background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)",
              color: "#60a5fa", fontSize: "0.72rem", fontFamily: "DM Mono, monospace",
            }}>
              ● Sesión activa
            </div>
          )}
        </div>

        {/* Alertas */}
        {bajoStock.length > 0 && (
          <div style={{
            padding: "0.7rem 1rem", borderRadius: "10px", marginBottom: "0.75rem",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", fontSize: "0.82rem",
          }}>
            ⚠️ {bajoStock.length} producto{bajoStock.length > 1 ? "s" : ""} con stock bajo o agotado
          </div>
        )}

        {/* Buscador */}
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar ingrediente o proveedor..."
          style={{
            width: "100%", padding: "0.65rem 1rem",
            background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
            borderRadius: "10px", color: "var(--kd-text-primary)",
            fontSize: "0.875rem", fontFamily: "DM Sans, sans-serif", outline: "none",
          }}
        />
      </div>

      {/* Lista de productos */}
      {cargando ? (
        <div className="kd-empty"><div className="kd-spinner" /><p>Cargando inventario...</p></div>
      ) : productosFiltrados.length === 0 ? (
        <div className="kd-empty"><span style={{ fontSize: "2rem" }}>📦</span><p>Sin productos</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {productosFiltrados.map(p => {
            const nivel = COLOR_NIVEL(p);
            const pct   = Math.min(1, p.cantidad_actual / Math.max(p.cantidad_minima * 2, 1));
            return (
              <div key={p.id} style={{
                background: "var(--kd-bg-card)",
                border: `1px solid var(--kd-border)`,
                borderLeft: `3px solid ${nivel.color}`,
                borderRadius: "12px", padding: "0.9rem 1.1rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span>{nivel.emoji}</span>
                      <p style={{ fontWeight: "600", color: "var(--kd-text-primary)", fontSize: "0.9rem", margin: 0 }}>
                        {p.nombre}
                      </p>
                      <span style={{
                        fontSize: "0.65rem", padding: "0.1rem 0.5rem", borderRadius: "99px",
                        background: p.bajo_stock ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.1)",
                        color: nivel.color, border: `1px solid ${nivel.color}33`,
                        fontFamily: "DM Mono, monospace",
                      }}>
                        {nivel.label}
                      </span>
                    </div>
                    <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.72rem", margin: "0.2rem 0 0.5rem" }}>
                      {p.proveedor}
                    </p>

                    {/* Barra de nivel */}
                    <div style={{ height: "4px", background: "var(--kd-border)", borderRadius: "99px", overflow: "hidden", marginBottom: "0.4rem" }}>
                      <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: nivel.color, borderRadius: "99px", transition: "width 0.3s" }} />
                    </div>

                    <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.82rem", color: nivel.color, margin: 0 }}>
                      {p.cantidad_actual} / {p.cantidad_minima} {p.unidad}
                    </p>
                  </div>

                  {/* Botones */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexShrink: 0 }}>
                    <button
                      onClick={() => handleAccion(p, "ingreso")}
                      style={{
                        padding: "0.35rem 0.75rem", borderRadius: "8px",
                        background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)",
                        color: "#60a5fa", fontSize: "0.75rem", fontWeight: "600",
                        cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      ➕ Ingresar
                    </button>
                    <button
                      onClick={() => handleAccion(p, "ajuste")}
                      style={{
                        padding: "0.35rem 0.75rem", borderRadius: "8px",
                        background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
                        color: "var(--kd-text-secondary)", fontSize: "0.75rem",
                        cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      ✏️ Ajustar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockCocina;