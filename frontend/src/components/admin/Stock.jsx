// frontend/src/components/admin/Stock.jsx
// Módulo de gestión de inventario — Cocina y Bar

import { useState, useEffect, useCallback } from "react";
import { stockService } from "../../services/stockService";
import Modal from "./Modal";

// ── Helpers ───────────────────────────────────────────────────────
const UNIDADES = ["unidad", "kg", "litro", "botella", "caja", "paquete", "sobre", "gramo"];

const COLOR_NIVEL = (producto) => {
  const pct = producto.cantidad_actual / (producto.cantidad_minima || 1);
  if (pct <= 0)   return { barra: "var(--red)",   chip: "chip-rojo",  label: "Agotado" };
  if (pct <= 1)   return { barra: "var(--red)",   chip: "chip-rojo",  label: "⚠️ Bajo" };
  if (pct <= 1.5) return { barra: "var(--amber)", chip: "chip-amber", label: "⚡ Medio" };
  return           { barra: "var(--green)",  chip: "chip-verde", label: "OK" };
};

const BarraStock = ({ producto }) => {
  const pct    = Math.min(1, producto.cantidad_actual / Math.max(producto.cantidad_minima * 2, 1));
  const nivel  = COLOR_NIVEL(producto);
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div style={{ height: "4px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.round(pct * 100)}%`,
          background: nivel.barra, borderRadius: "99px",
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
};

// ── Tarjeta de producto ───────────────────────────────────────────
const TarjetaProducto = ({ p, onIngreso, onAjuste, onEliminar }) => {
  const nivel = COLOR_NIVEL(p);
  return (
    <div className="admin-card stock-card" style={{
      borderLeft: `3px solid ${nivel.barra}`,
      opacity: p.cantidad_actual <= 0 ? 0.8 : 1,
    }}>
      <div className="stock-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="stock-nombre">{p.nombre}</p>
          <p className="texto-muted" style={{ fontSize: "0.72rem" }}>
            {p.proveedor}
          </p>
        </div>
        <span className={`chip ${nivel.chip}`} style={{ flexShrink: 0 }}>
          {nivel.label}
        </span>
      </div>

      <BarraStock producto={p} />

      <div className="stock-cantidades">
        <div className="stock-cantidad-item">
          <span className="campo-label">Actual</span>
          <span className="stock-numero" style={{ color: nivel.barra }}>
            {p.cantidad_actual} {p.unidad}
          </span>
        </div>
        <div className="stock-cantidad-item">
          <span className="campo-label">Mínimo</span>
          <span className="stock-numero" style={{ color: "var(--text-2)" }}>
            {p.cantidad_minima} {p.unidad}
          </span>
        </div>
      </div>

      <div className="stock-acciones">
        <button
          className="btn-secundario"
          style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
          onClick={() => onIngreso(p)}
        >
          ＋ Ingreso
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
          onClick={() => onAjuste(p)}
        >
          ✏️ Ajustar
        </button>
        <button
          className="btn-eliminar"
          onClick={() => onEliminar(p)}
          title="Eliminar producto"
        >✕</button>
      </div>
    </div>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
const Stock = ({ toast }) => {
  const [productos,     setProductos]     = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [categoriaTab,  setCategoriaTab]  = useState("cocina");
  const [busqueda,      setBusqueda]      = useState("");
  const [modalForm,     setModalForm]     = useState(false);  // crear producto
  const [modalIngreso,  setModalIngreso]  = useState(null);   // producto seleccionado
  const [modalAjuste,   setModalAjuste]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [procesando,    setProcesando]    = useState(false);

  // Form crear
  const [form, setForm] = useState({
    nombre: "", proveedor: "", categoria: "cocina",
    unidad: "unidad", cantidad_actual: "", cantidad_minima: "5",
  });

  // Form ingreso/ajuste
  const [movForm, setMovForm] = useState({ cantidad: "", observacion: "", fecha: "" });

  const cargar = useCallback(async () => {
    try {
      const data = await stockService.getAll();
      setProductos(data.productos || []);
    } catch (err) {
      if (toast) toast.error("Error al cargar inventario.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtrar por tab y búsqueda
  const productosFiltrados = productos
    .filter(p => p.categoria === categoriaTab)
    .filter(p =>
      !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.proveedor.toLowerCase().includes(busqueda.toLowerCase())
    );

  const bajoStock = productos.filter(p => p.bajo_stock);
  const totalCocina = productos.filter(p => p.categoria === "cocina").length;
  const totalBar    = productos.filter(p => p.categoria === "bar").length;

  // ── Crear producto ─────────────────────────────────────────────
  const handleCrear = async () => {
    if (!form.nombre.trim() || !form.proveedor.trim())
      return toast?.error("Nombre y proveedor son requeridos.");
    setProcesando(true);
    try {
      await stockService.crear({
        ...form,
        cantidad_actual: parseFloat(form.cantidad_actual) || 0,
        cantidad_minima: parseFloat(form.cantidad_minima) || 5,
      });
      if (toast) toast.exito(`"${form.nombre}" agregado al inventario`);
      setModalForm(false);
      setForm({ nombre:"", proveedor:"", categoria:"cocina", unidad:"unidad", cantidad_actual:"", cantidad_minima:"5" });
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── Registrar ingreso ──────────────────────────────────────────
  const handleIngreso = async () => {
    const cant = parseFloat(movForm.cantidad);
    if (!cant || cant <= 0) return toast?.error("Cantidad inválida.");
    setProcesando(true);
    try {
      await stockService.registrarMovimiento({
        producto_id: modalIngreso.id,
        tipo: "ingreso",
        cantidad: cant,
        observacion: movForm.observacion,
        fecha: movForm.fecha || new Date().toISOString().split("T")[0],
      });
      if (toast) toast.exito(`+${cant} ${modalIngreso.unidad} ingresados a "${modalIngreso.nombre}"`);
      setModalIngreso(null);
      setMovForm({ cantidad: "", observacion: "", fecha: "" });
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── Ajuste directo ─────────────────────────────────────────────
  const handleAjuste = async () => {
    const cant = parseFloat(movForm.cantidad);
    if (cant == null || cant < 0) return toast?.error("Cantidad inválida.");
    setProcesando(true);
    try {
      await stockService.registrarMovimiento({
        producto_id: modalAjuste.id,
        tipo: "ajuste",
        cantidad: cant,
        observacion: movForm.observacion || "Ajuste manual",
        fecha: movForm.fecha || new Date().toISOString().split("T")[0],
      });
      if (toast) toast.exito(`Stock de "${modalAjuste.nombre}" ajustado a ${cant}`);
      setModalAjuste(null);
      setMovForm({ cantidad: "", observacion: "", fecha: "" });
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────
  const handleEliminar = async () => {
    setProcesando(true);
    try {
      await stockService.eliminar(modalEliminar.id);
      if (toast) toast.advertencia(`"${modalEliminar.nombre}" eliminado`);
      setModalEliminar(null);
      cargar();
    } catch (err) {
      if (toast) toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="seccion-container">
        <div className="seccion-header"><h2 className="seccion-titulo">📦 Stock</h2></div>
        <p className="texto-secundario">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="seccion-container">

      {/* ── ENCABEZADO ── */}
      <div className="seccion-header">
        <h2 className="seccion-titulo">📦 Stock e inventario</h2>
        <button className="btn-primario"
          style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
          onClick={() => setModalForm(true)}>
          + Agregar producto
        </button>
      </div>

      {/* ── ALERTAS DE BAJO STOCK ── */}
      {bajoStock.length > 0 && (
        <div className="stock-alertas">
          <p className="stock-alertas-titulo">
            ⚠️ {bajoStock.length} producto{bajoStock.length > 1 ? "s" : ""} con stock bajo o agotado
          </p>
          <div className="stock-alertas-lista">
            {bajoStock.map(p => (
              <div key={p.id} className="stock-alerta-item">
                <span className={`chip ${COLOR_NIVEL(p).chip}`} style={{ fontSize: "0.68rem" }}>
                  {p.cantidad_actual <= 0 ? "Agotado" : "Bajo"}
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.nombre}</span>
                <span className="texto-muted" style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>
                  {p.cantidad_actual}/{p.cantidad_minima} {p.unidad}
                </span>
                <button
                  className="btn-secundario"
                  style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem" }}
                  onClick={() => { setModalIngreso(p); setMovForm({ cantidad:"", observacion:"", fecha:"" }); }}
                >
                  + Reponer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS Y BUSCADOR ── */}
      <div className="stock-controles">
        <div className="tab-selector">
          <button className={`tab-btn ${categoriaTab === "cocina" ? "activo" : ""}`}
            onClick={() => setCategoriaTab("cocina")}>
            🍳 Cocina ({totalCocina})
          </button>
          <button className={`tab-btn ${categoriaTab === "bar" ? "activo" : ""}`}
            onClick={() => setCategoriaTab("bar")}>
            🍹 Bar ({totalBar})
          </button>
        </div>
        <input
          className="campo-input"
          style={{ maxWidth: "240px" }}
          placeholder="Buscar producto o proveedor..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      {productosFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <p className="texto-secundario">
            {busqueda ? `Sin resultados para "${busqueda}"` : `No hay productos de ${categoriaTab} registrados.`}
          </p>
        </div>
      ) : (
        <div className="stock-grid">
          {productosFiltrados.map(p => (
            <TarjetaProducto
              key={p.id}
              p={p}
              onIngreso={(prod) => { setModalIngreso(prod); setMovForm({ cantidad:"", observacion:"", fecha:"" }); }}
              onAjuste={(prod)  => { setModalAjuste(prod);  setMovForm({ cantidad: String(prod.cantidad_actual), observacion:"", fecha:"" }); }}
              onEliminar={(prod)=> setModalEliminar(prod)}
            />
          ))}
        </div>
      )}

      {/* ══ MODAL: CREAR PRODUCTO ══════════════════════════════ */}
      {modalForm && (
        <div className="modal-overlay" onClick={() => setModalForm(false)}>
          <div className="modal-box" style={{ maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal">
              <span className="modal-titulo">Agregar producto al inventario</span>
              <button className="modal-cerrar" onClick={() => setModalForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="campo-grupo">
                <label className="campo-label">Nombre del producto *</label>
                <input className="campo-input" autoFocus placeholder="Ej: Aceite de oliva"
                  value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Proveedor *</label>
                <input className="campo-input" placeholder="Ej: Distribuidora Sur"
                  value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="campo-grupo">
                  <label className="campo-label">Categoría *</label>
                  <select className="campo-input" value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    <option value="cocina">🍳 Cocina</option>
                    <option value="bar">🍹 Bar</option>
                  </select>
                </div>
                <div className="campo-grupo">
                  <label className="campo-label">Unidad de medida</label>
                  <select className="campo-input" value={form.unidad}
                    onChange={e => setForm({ ...form, unidad: e.target.value })}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="campo-grupo">
                  <label className="campo-label">Cantidad inicial</label>
                  <input className="campo-input" type="number" min="0" placeholder="0"
                    value={form.cantidad_actual}
                    onChange={e => setForm({ ...form, cantidad_actual: e.target.value })} />
                </div>
                <div className="campo-grupo">
                  <label className="campo-label">Cantidad mínima (alerta)</label>
                  <input className="campo-input" type="number" min="1" placeholder="5"
                    value={form.cantidad_minima}
                    onChange={e => setForm({ ...form, cantidad_minima: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setModalForm(false)}>Cancelar</button>
              <button className="btn-primario" onClick={handleCrear} disabled={procesando}>
                {procesando ? "Guardando..." : "Agregar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: INGRESO ════════════════════════════════════ */}
      {modalIngreso && (
        <div className="modal-overlay" onClick={() => setModalIngreso(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal">
              <span className="modal-titulo">Registrar ingreso</span>
              <button className="modal-cerrar" onClick={() => setModalIngreso(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
                Producto: <strong style={{ color: "var(--text-1)" }}>{modalIngreso.nombre}</strong>
                <br />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem" }}>
                  Stock actual: {modalIngreso.cantidad_actual} {modalIngreso.unidad}
                </span>
              </p>
              <div className="campo-grupo">
                <label className="campo-label">Cantidad a ingresar ({modalIngreso.unidad})</label>
                <input className="campo-input" type="number" min="0.1" step="0.1" autoFocus
                  placeholder="0" value={movForm.cantidad}
                  onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Fecha de ingreso (opcional)</label>
                <input className="campo-input" type="date"
                  value={movForm.fecha}
                  onChange={e => setMovForm({ ...movForm, fecha: e.target.value })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Observación (opcional)</label>
                <input className="campo-input" placeholder="Ej: Factura #1234"
                  value={movForm.observacion}
                  onChange={e => setMovForm({ ...movForm, observacion: e.target.value })} />
              </div>
              {movForm.cantidad && (
                <div style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", borderRadius: "var(--r-sm)", padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "var(--green)" }}>
                  Nuevo stock: {(parseFloat(modalIngreso.cantidad_actual) + parseFloat(movForm.cantidad || 0)).toFixed(2)} {modalIngreso.unidad}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setModalIngreso(null)}>Cancelar</button>
              <button className="btn-primario" onClick={handleIngreso} disabled={procesando}>
                {procesando ? "Registrando..." : "Registrar ingreso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: AJUSTE ═════════════════════════════════════ */}
      {modalAjuste && (
        <div className="modal-overlay" onClick={() => setModalAjuste(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header modal-header-normal">
              <span className="modal-titulo">Ajustar stock</span>
              <button className="modal-cerrar" onClick={() => setModalAjuste(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="texto-secundario" style={{ marginBottom: "1rem" }}>
                Ajuste directo de la cantidad real en bodega para <strong style={{ color: "var(--text-1)" }}>{modalAjuste.nombre}</strong>.
              </p>
              <div className="campo-grupo">
                <label className="campo-label">Nueva cantidad ({modalAjuste.unidad})</label>
                <input className="campo-input" type="number" min="0" step="0.1" autoFocus
                  value={movForm.cantidad}
                  onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} />
              </div>
              <div className="campo-grupo">
                <label className="campo-label">Motivo del ajuste</label>
                <input className="campo-input" placeholder="Ej: Conteo físico, merma, vencimiento..."
                  value={movForm.observacion}
                  onChange={e => setMovForm({ ...movForm, observacion: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setModalAjuste(null)}>Cancelar</button>
              <button className="btn-primario" onClick={handleAjuste} disabled={procesando}>
                {procesando ? "Ajustando..." : "Guardar ajuste"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: ELIMINAR ═══════════════════════════════════ */}
      <Modal
        abierto={!!modalEliminar}
        titulo="Eliminar producto"
        variante="peligro"
        labelConfirmar={procesando ? "Eliminando..." : "Eliminar"}
        labelCancelar="Cancelar"
        onConfirmar={handleEliminar}
        onCancelar={() => setModalEliminar(null)}
      >
        {modalEliminar && (
          <p className="texto-secundario">
            ¿Eliminar <strong style={{ color: "var(--text-1)" }}>{modalEliminar.nombre}</strong> del inventario?
            Esta acción no se puede deshacer.
          </p>
        )}
      </Modal>

    </div>
  );
};

export default Stock;