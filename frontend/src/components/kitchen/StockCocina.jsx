// frontend/src/components/kitchen/StockCocina.jsx
// Solo productos de COCINA. PIN requerido para modificar.

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../services/config";
import { getImage } from "../../utils/getImage";
import StockResumenPanel from "./StockResumenPanel";
import ModalPin from "./modals/ModalPin";

const API = `${API_URL}/stock`;
const PRODUCTOS_POR_PAGINA = 15;

const COLOR_NIVEL = (p) => {
  const pct = p.cantidad_actual / Math.max(p.cantidad_minima, 1);
  if (pct <= 0)   return { color: "#ef4444", label: "Agotado", emoji: "🔴" };
  if (pct <= 1)   return { color: "#ef4444", label: "Bajo",    emoji: "⚠️" };
  if (pct <= 1.5) return { color: "#f59e0b", label: "Medio",   emoji: "⚡" };
  return           { color: "#22c55e", label: "OK",     emoji: "✅" };
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

const ModalBorrar = ({producto,pinActivo,onConfirmar,onCancelar}) => {

const borrar = async()=>{

try{

const res = await fetch(`${API}/cocina/desactivar`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
pin:pinActivo,
producto_id:producto.id
})
});


const data = await res.json();

if(data.ok){
 onConfirmar();
}else{
 alert(data.msg || "No se pudo borrar");
}

}catch(err){
alert("Error de conexión");
}

};


return(
<div className="kd-modal-overlay">
<div className="kd-modal">

<h3>🗑️ Quitar ingrediente</h3>

<p>
¿Eliminar <b>{producto.nombre}</b> del stock de cocina?
</p>


<button onClick={onCancelar}>
Cancelar
</button>

<button onClick={borrar}>
Confirmar
</button>


</div>
</div>
)

}


// ── Modal agregar ingrediente existente ────────────────────────────
// Muestra productos de la BD que aún no están en categoría "cocina"
// y permite activarlos (cambia su categoría a "cocina").
const ModalAgregarIngrediente = ({ catalogo, pinActivo, onConfirmar, onCancelar }) => {
  const [busqueda,       setBusqueda]       = useState("");
  const [seleccionado,   setSeleccionado]   = useState(null);
  const [cantidadMinima, setCantidadMinima] = useState("");
  const [carg,           setCarg]           = useState(false);
  const [error,          setError]          = useState("");

  const disponibles = catalogo.filter(p =>
    !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const enviar = async () => {
    if (!seleccionado) { setError("Selecciona un ingrediente."); return; }

    setCarg(true);
    try {
      const res = await fetch(`${API}/cocina/activar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pin: pinActivo,
          producto_id: seleccionado.id,
          cantidad_minima: cantidadMinima || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onConfirmar();
      } else {
        setError(data.msg || "Error al agregar el ingrediente.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setCarg(false);
    }
  };

  return (
    <div className="kd-modal-overlay" onClick={onCancelar}>
      <div className="kd-modal" style={{ maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
        <button className="kd-modal-close" onClick={onCancelar}>✕</button>

        <h3 style={{ color: "var(--kd-text-primary)", marginBottom: "0.25rem" }}>
          📥 Agregar ingrediente
        </h3>
        <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.82rem", marginBottom: "1rem" }}>
          Estos productos ya existen en el sistema pero no están activos en cocina.
          Selecciona uno para que empiece a aparecer aquí.
        </p>

        {!seleccionado ? (
          <>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              autoFocus
              style={{
                width: "100%", padding: "0.65rem 1rem", marginBottom: "0.75rem",
                background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
                borderRadius: "10px", color: "var(--kd-text-primary)",
                fontSize: "0.875rem", outline: "none",
              }}
            />
            <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {disponibles.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--kd-text-muted)", textAlign: "center", padding: "1rem 0" }}>
                  No hay productos disponibles para agregar. Todo lo que existe ya está activo en cocina.
                </p>
              ) : disponibles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSeleccionado(p)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.6rem 0.8rem", background: "var(--kd-bg-elevated)",
                    border: "1px solid var(--kd-border)", borderRadius: "10px",
                    color: "var(--kd-text-primary)", cursor: "pointer", textAlign: "left",
                    fontSize: "0.85rem", width: "100%",
                  }}
                >
                  <span>{p.nombre}</span>
                  <span style={{ color: "var(--kd-text-muted)", fontSize: "0.7rem" }}>
                    {p.categoria}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{
              padding: "0.6rem 0.9rem", borderRadius: "8px", marginBottom: "1rem",
              background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)",
              color: "#60a5fa", fontSize: "0.85rem", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <strong>{seleccionado.nombre}</strong>
                <p style={{ fontSize: "0.7rem", color: "var(--kd-text-muted)", margin: "0.15rem 0 0" }}>
                  Categoría actual: {seleccionado.categoria}
                </p>
              </div>
              <button
                onClick={() => setSeleccionado(null)}
                style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.78rem" }}
              >
                Cambiar
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: "var(--kd-text-secondary)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                Cantidad mínima para alertas ({seleccionado.unidad || "unid."}) — opcional
              </p>
              <input
                type="number" min="0" step="0.1" autoFocus
                value={cantidadMinima}
                onChange={e => { setCantidadMinima(e.target.value); setError(""); }}
                placeholder={`Actual: ${seleccionado.cantidad_minima ?? "—"}`}
                style={{
                  width: "100%", padding: "0.65rem 1rem",
                  background: "var(--kd-bg-elevated)", border: "1px solid var(--kd-border)",
                  borderRadius: "8px", color: "var(--kd-text-primary)", fontSize: "1rem", outline: "none",
                }}
              />
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{error}</p>}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={onCancelar} style={{
                flex: 1, padding: "0.7rem", background: "var(--kd-bg-elevated)",
                border: "1px solid var(--kd-border)", borderRadius: "8px",
                color: "var(--kd-text-secondary)", cursor: "pointer",
              }}>
                Cancelar
              </button>
              <button onClick={enviar} disabled={carg} style={{
                flex: 2, padding: "0.7rem", background: "#2563eb",
                border: "none", borderRadius: "8px", color: "white", fontWeight: "600",
                cursor: "pointer", opacity: carg ? 0.6 : 1,
              }}>
                {carg ? "Agregando..." : "Agregar a cocina"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};



// ── Componente principal StockCocina ─────────────────────────────
const StockCocina = () => {
  const [productos,   setProductos]   = useState([]);
  const [catalogo,    setCatalogo]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [busqueda,    setBusqueda]    = useState("");
  const [pinActivo,   setPinActivo]   = useState(null);
  const [pinExpira,   setPinExpira]   = useState(null);
  const [showPin,     setShowPin]     = useState(false);
  const [accion,      setAccion]      = useState(null); // { producto, tipo } | { tipo:"agregar" }
  const [toast,       setToast]       = useState("");
  const [visibles,    setVisibles]    = useState(PRODUCTOS_POR_PAGINA);

  const cargar = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/cocina/productos`);
      const data = await res.json();
      setProductos(data.productos || []);
    } catch { /* silencioso */ }
    finally { setCargando(false); }
  }, []);

  const cargarCatalogo = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/cocina/catalogo`);
      const data = await res.json();
      setCatalogo(data.productos || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 15000);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    setVisibles(PRODUCTOS_POR_PAGINA);
  }, [busqueda]);

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
      setAccion({ producto, tipo, pendiente: true });
    }
  };

  const handleAbrirAgregar = () => {
    cargarCatalogo();
    if (pinEsValido()) {
      setAccion({ tipo: "agregar" });
    } else {
      setPinActivo(null);
      setShowPin(true);
      setAccion({ tipo: "agregar", pendiente: true });
    }
  };

  const handlePinConfirmado = (pin) => {
    setPinActivo(pin);
    setPinExpira(Date.now() + 10 * 60 * 1000);
    setShowPin(false);
    if (accion?.pendiente) {
      setAccion({ ...accion, pendiente: false });
    }
  };

  const handleMovimientoConfirmado = () => {
    setAccion(null);
    cargar();
    setPinExpira(Date.now() + 10 * 60 * 1000);
    mostrarToast("✓ Stock actualizado correctamente");
  };

  const handleIngredienteAgregado = () => {
    setAccion(null);
    cargar();
    setPinExpira(Date.now() + 10 * 60 * 1000);
    mostrarToast("✓ Ingrediente agregado al stock de cocina");
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

  const productosVisibles = productosFiltrados.slice(0, visibles);
  const bajoStock = productos.filter(p => p.bajo_stock);

  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {toast && <div className="kd-alerta">{toast}</div>}

      {showPin && (
        <ModalPin
          onConfirmar={handlePinConfirmado}
          onCancelar={() => { setShowPin(false); setAccion(null); }}
        />
      )}

{accion &&
 accion.tipo !== "agregar" &&
 accion.tipo !== "borrar" &&
 !accion.pendiente && (
  <ModalMovimiento
    producto={accion.producto}
    tipo={accion.tipo}
    pinActivo={pinActivo}
    onConfirmar={handleMovimientoConfirmado}
    onCancelar={() => setAccion(null)}
  />
)}

{accion &&
 accion.tipo === "borrar" &&
 !accion.pendiente && (
  <ModalBorrar
    producto={accion.producto}
    pinActivo={pinActivo}
    onConfirmar={() => {
      setAccion(null);
      cargar();
      mostrarToast("✓ Ingrediente eliminado");
    }}
    onCancelar={() => setAccion(null)}
  />
)}

{accion &&
 accion.tipo === "agregar" &&
 !accion.pendiente && (
  <ModalAgregarIngrediente
    catalogo={catalogo}
    pinActivo={pinActivo}
    onConfirmar={handleIngredienteAgregado}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {pinEsValido() && (
              <div style={{
                padding: "0.25rem 0.75rem", borderRadius: "99px",
                background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.35)",
                color: "#60a5fa", fontSize: "0.72rem", fontFamily: "DM Mono, monospace",
              }}>
                ● Sesión activa
              </div>
            )}
            <button
              onClick={handleAbrirAgregar}
              style={{
                padding: "0.45rem 0.9rem", borderRadius: "8px",
                background: "var(--kc-orange)", border: "none",
                color: "#1a1206", fontSize: "0.8rem", fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ➕ Agregar ingrediente
            </button>
          </div>
        </div>

        {bajoStock.length > 0 && (
          <div style={{
            padding: "0.7rem 1rem", borderRadius: "10px", marginBottom: "0.75rem",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", fontSize: "0.82rem",
          }}>
            ⚠️ {bajoStock.length} producto{bajoStock.length > 1 ? "s" : ""} con stock bajo o agotado
          </div>
        )}

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

      {cargando ? (
        <div className="kd-empty"><div className="kd-spinner" /><p>Cargando inventario...</p></div>
      ) : productosFiltrados.length === 0 ? (
        <div className="kd-empty"><span style={{ fontSize: "2rem" }}>📦</span><p>Sin productos</p></div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {productosVisibles.map(p => {
              const nivel = COLOR_NIVEL(p);
              const pct   = Math.min(1, p.cantidad_actual / Math.max(p.cantidad_minima * 2, 1));
              const img   = getImage(p.nombre, p.imagen);
              return (
                <div key={p.id} style={{
                  background: "var(--kd-bg-card)",
                  border: `1px solid var(--kd-border)`,
                  borderLeft: `3px solid ${nivel.color}`,
                  borderRadius: "12px", padding: "0.9rem 1.1rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden",
                      flexShrink: 0, background: "var(--kc-bg-hover)", border: "1px solid var(--kd-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {img
                        ? <img src={img} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "1.2rem", opacity: 0.5 }}>📦</span>
                      }
                    </div>
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

                      <div style={{ height: "4px", background: "var(--kd-border)", borderRadius: "99px", overflow: "hidden", marginBottom: "0.4rem" }}>
                        <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: nivel.color, borderRadius: "99px", transition: "width 0.3s" }} />
                      </div>

                      <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.82rem", color: nivel.color, margin: 0 }}>
                        {p.cantidad_actual} / {p.cantidad_minima} {p.unidad}
                      </p>
                    </div>

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

                      <button
                        onClick={() => handleAccion(p, "borrar")}
                        style={{
                          padding:"0.35rem 0.75rem",
                          borderRadius:"8px",
                          background:"rgba(239,68,68,0.15)",
                          border:"1px solid rgba(239,68,68,0.35)",
                          color:"#f87171",
                          fontSize:"0.75rem",
                          cursor:"pointer",
                          fontFamily:"DM Sans, sans-serif",
                        }}
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibles < productosFiltrados.length && (
            <div className="kc-cargar-mas-wrap" style={{ flexDirection: "column" }}>
              <button
                className="kc-cargar-mas-btn"
                onClick={() => setVisibles(v => v + PRODUCTOS_POR_PAGINA)}
              >
                Cargar más ingredientes
              </button>
              <p className="kc-cargar-mas-info">
                Mostrando {productosVisibles.length} de {productosFiltrados.length}
              </p>
            </div>
          )}
        </>
      )}
    </div>
    <StockResumenPanel productos={productos} />
    </div>
  );
};

export default StockCocina;