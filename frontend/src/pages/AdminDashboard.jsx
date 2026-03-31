// ══════════════════════════════════════════════════════════════════
// pages/AdminDashboard.jsx — logout corregido
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth }        from "../context/AuthContext";
import { useBeforeUnload, useBlockBack } from "../hooks/useBeforeUnload";

import { getItem, setItem, KEYS }         from "../services/storageService";
import { cargarMesas, guardarMesas, crearMesa, eliminarMesa,
         modificarCantidadItem, aplicarPagoTotal, aplicarPagoParcial,
         actualizarMesaEnArreglo }          from "../services/mesaService";
import { cargarCaja, cargarHistorial, crearAperturaCaja,
         guardarCaja, cerrarCaja as cerrarCajaService } from "../services/cajaService";
import { cargarUsuarios }                  from "../services/userService";
import { registrarVenta }                  from "../services/api/ventasApi";
import * as usuariosApi                    from "../services/api/usuariosApi";

import Navbar           from "../components/admin/Navbar";
import Caja             from "../components/admin/Caja";
import Mesas            from "../components/admin/Mesas";
import Historial        from "../components/admin/Historial";
import Usuarios         from "../components/admin/Usuarios";
import SesionesActivas  from "../components/admin/SesionesActivas";
import ToastContainer   from "../components/admin/ToastContainer";
import Modal            from "../components/admin/Modal";

import { useToast } from "../hooks/useToast";
import "./Admin.css";

const AdminDashboard = () => {
  const navigate            = useNavigate();
  const { usuario, logout } = useAuth();
  const { toasts, remover, toast } = useToast();

  const [seccion,        setSeccion]        = useState("inicio");
  const [modalSalida,    setModalSalida]    = useState(false);
  const [servicioActivo, setServicioActivo] = useState(() => getItem(KEYS.SERVICIO_ACTIVO, true));
  const [mesas,          setMesas]          = useState(() => cargarMesas());
  const [cajaAbierta,    setCajaAbierta]    = useState(() => cargarCaja().abierta);
  const [caja,           setCaja]           = useState(() => cargarCaja().caja);
  const [historial,      setHistorial]      = useState(() => cargarHistorial());
  const [usuarios,       setUsuarios]       = useState(() => cargarUsuarios());

  // Advertencia al cerrar pestaña solo si la caja está abierta
  useBeforeUnload(cajaAbierta);

  // Interceptar botón "atrás": muestra modal en vez de navegar
  useBlockBack(true, useCallback(() => setModalSalida(true), []));

  // Sincronización entre tabs
  const sincronizar = useCallback((e) => {
    if (e.key === KEYS.MESAS)     { const m = JSON.parse(e.newValue || "[]"); if (m.length > 0) setMesas(m); }
    if (e.key === KEYS.HISTORIAL) setHistorial(JSON.parse(e.newValue || "[]"));
    if (e.key === KEYS.USUARIOS)  setUsuarios(JSON.parse(e.newValue || "[]"));
    if (e.key === KEYS.CAJA_ACTUAL) setCaja(JSON.parse(e.newValue || "null"));
  }, []);

  useEffect(() => {
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, [sincronizar]);

  // Toast de bienvenida al entrar
  useEffect(() => {
    if (usuario) {
      const nombre = usuario.correo.split("@")[0];
      const rol = { administrador: "Administrador", cocina: "Cocina", bartender: "Bartender" }[usuario.rol] || usuario.rol;
      toast.info(`Hola, ${nombre} (${rol})`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SALIDA SEGURA ─────────────────────────────────────────────
  // Muestra modal si la caja está abierta, si no cierra directo
  const manejarSalida = () => {
    if (cajaAbierta) {
      setModalSalida(true);
    } else {
      ejecutarLogout();
    }
  };

  // ⚠️ FIX CLAVE: logout() primero, navigate() después con replace:true
  // replace:true asegura que el botón "atrás" desde /login
  // no pueda regresar al panel sin autenticarse.
  const ejecutarLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ── CAJA ──────────────────────────────────────────────────────
  const handleAbrirCaja = (montoInicial) => {
    const nuevaCaja = crearAperturaCaja(montoInicial);
    guardarCaja(nuevaCaja);
    setCaja(nuevaCaja);
    setCajaAbierta(true);
    setSeccion("mesas");
    toast.exito(`Caja abierta con $${montoInicial.toLocaleString("es-CO")}`);
  };

  const handleCerrarCaja = () => {
    if (!caja) return;
    const { resumen, nuevoHistorial } = cerrarCajaService(caja, historial);
    setHistorial(nuevoHistorial);
    setCaja(null);
    setCajaAbierta(false);
    toast.exito(`Caja cerrada. Total: $${resumen.totalVentas.toLocaleString("es-CO")}`);
    setSeccion("historial");
  };

  const handleToggleServicio = () => {
    const nuevo = !servicioActivo;
    setServicioActivo(nuevo);
    setItem(KEYS.SERVICIO_ACTIVO, nuevo);
    toast.info(nuevo ? "Servicio activado" : "Servicio pausado");
  };

  // ── MESAS ─────────────────────────────────────────────────────
  const persistirMesas = (nuevas) => { setMesas(nuevas); guardarMesas(nuevas); };

  const handleCrearMesa    = (nombre) => { const n = crearMesa(mesas, nombre); persistirMesas(n); toast.exito(`"${nombre || `Mesa ${n.at(-1).id}`}" creada`); };
  const handleEliminarMesa = (id) => {
    if (mesas.find((m) => m.id === id)?.ocupada) { toast.error("No puedes eliminar una mesa con pedidos activos."); return; }
    persistirMesas(eliminarMesa(mesas, id));
    toast.advertencia("Mesa eliminada");
  };

  // ── PEDIDOS Y PAGOS ───────────────────────────────────────────
  const handleModificarItem = (mesa, index, delta) =>
    persistirMesas(actualizarMesaEnArreglo(mesas, modificarCantidadItem(mesa, index, delta)));

  const handlePagoTotal = async (mesa, metodo) => {
    if (!cajaAbierta || !caja) { toast.error("Abre la caja antes de registrar pagos."); return; }
    const res = await registrarVenta({ mesa: mesa.nombre, total: mesa.total, metodo, items: mesa.pedido, usuarioId: usuario?.id });
    if (!res.ok) { toast.error(res.error); return; }
    setCaja(res.caja);
    persistirMesas(actualizarMesaEnArreglo(mesas, aplicarPagoTotal(mesa)));
    toast.exito(`Pago: $${mesa.total.toLocaleString("es-CO")} — ${metodo}`);
  };

  const handlePagoParcial = async (mesa, items, metodo) => {
    if (!cajaAbierta || !caja) { toast.error("Abre la caja antes de registrar pagos."); return; }
    const total = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
    const res   = await registrarVenta({ mesa: mesa.nombre, total, metodo, items, usuarioId: usuario?.id });
    if (!res.ok) { toast.error(res.error); return; }
    setCaja(res.caja);
    persistirMesas(actualizarMesaEnArreglo(mesas, aplicarPagoParcial(mesa, items.map((i) => i.nombre))));
    toast.exito(`Pago parcial: $${total.toLocaleString("es-CO")} — ${metodo}`);
  };

  // ── USUARIOS ──────────────────────────────────────────────────
  const handleCrearUsuario = async ({ correo, password, rol }) => {
    const res = await usuariosApi.crearUsuario({ correo, password, rol });
    if (res.ok) { setUsuarios(res.usuarios); toast.exito(`Usuario ${correo} creado`); }
  };

  const handleEliminarUsuario = async (id) => {
    const res = await usuariosApi.eliminarUsuario(id);
    if (res.ok) { setUsuarios(res.usuarios); toast.advertencia("Usuario eliminado"); }
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="admin-container">
      <ToastContainer toasts={toasts} remover={remover} />

      <Navbar
        seccion={seccion}
        setSeccion={setSeccion}
        servicioActivo={servicioActivo}
        onSalir={manejarSalida}
      />

      <main className="admin-main">
        {seccion === "inicio"    && <Caja cajaAbierta={cajaAbierta} caja={caja} servicioActivo={servicioActivo} onAbrirCaja={handleAbrirCaja} onCerrarCaja={handleCerrarCaja} onToggleServicio={handleToggleServicio} />}
        {seccion === "mesas"     && <Mesas mesas={mesas} cajaAbierta={cajaAbierta} onCrearMesa={handleCrearMesa} onEliminarMesa={handleEliminarMesa} onModificarItem={handleModificarItem} onPagoTotal={handlePagoTotal} onPagoParcial={handlePagoParcial} />}
        {seccion === "historial" && <Historial historial={historial} />}
        {seccion === "usuarios"  && <Usuarios usuarios={usuarios} onCrearUsuario={handleCrearUsuario} onEliminarUsuario={handleEliminarUsuario} />}
        {seccion === "sesiones"  && <SesionesActivas />}
      </main>

      {/* Modal de confirmación al salir */}
      <Modal
        abierto={modalSalida}
        titulo="¿Seguro que deseas salir?"
        variante="peligro"
        labelConfirmar="Sí, cerrar sesión"
        labelCancelar="Quedarme"
        onConfirmar={ejecutarLogout}
        onCancelar={() => setModalSalida(false)}
      >
        <p className="texto-secundario">
          {cajaAbierta
            ? "⚠️ La caja está abierta. Si sales los datos quedan guardados, pero deberás volver a iniciar sesión."
            : "Estás a punto de cerrar tu sesión en MesaSmart."}
        </p>
      </Modal>
    </div>
  );
};

export default AdminDashboard;