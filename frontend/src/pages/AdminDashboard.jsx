// frontend/src/pages/AdminDashboard.jsx — versión final completa

import { useState, useEffect, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import { useAuth }       from "../context/AuthContext";
import { useBeforeUnload, useBlockBack } from "../hooks/useBeforeUnload";
import { useToast }      from "../hooks/useToast";

import { mesaService }    from "../services/mesaService";
import { pedidoService }  from "../services/pedidoService";
import { cajaService }    from "../services/cajaService";
import { usuarioService } from "../services/usuarioService";

import Navbar          from "../components/admin/Navbar";
import Dashboard       from "../components/admin/Dashboard";
import Caja            from "../components/admin/Caja";
import Mesas           from "../components/admin/Mesas";
import Egresos         from "../components/admin/Egresos";
import Historial       from "../components/admin/Historial";
import Usuarios        from "../components/admin/Usuarios";
import SesionesActivas from "../components/admin/SesionesActivas";
import ToastContainer  from "../components/admin/ToastContainer";
import Modal           from "../components/admin/Modal";

import "./Admin.css";

const AdminDashboard = () => {
  const navigate            = useNavigate();
  const { usuario, logout } = useAuth();
  const { toasts, remover, toast } = useToast();

  const [seccion,        setSeccion]        = useState("dashboard");
  const [modalSalida,    setModalSalida]    = useState(false);
  const [servicioActivo, setServicioActivo] = useState(true);

  const [mesas,          setMesas]          = useState([]);
  const [cajaAbierta,    setCajaAbierta]    = useState(false);
  const [caja,           setCaja]           = useState(null);
  const [historial,      setHistorial]      = useState([]);
  const [usuarios,       setUsuarios]       = useState([]);
  const [cargandoDatos,  setCargandoDatos]  = useState(true);

  // ── CARGA INICIAL ──────────────────────────────────────────────
  useEffect(() => {
    cargarDatosIniciales();
    toast.info(`Hola, ${usuario?.correo?.split("@")[0]} 👋`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosIniciales = async () => {
    setCargandoDatos(true);
    await Promise.all([cargarMesas(), cargarCaja()]);
    setCargandoDatos(false);
  };

  const cargarMesas = async () => {
    try {
      const data = await mesaService.getAll();
      setMesas(data.mesas || []);
    } catch (err) { toast.error("Error al cargar mesas: " + err.message); }
  };

  const cargarCaja = async () => {
    try {
      const data = await cajaService.getEstado();
      setCajaAbierta(data.abierta);
      setCaja(data.caja);
    } catch (err) { toast.error("Error al cargar caja: " + err.message); }
  };

  const cargarHistorial = async () => {
    try {
      const data = await cajaService.getHistorial();
      setHistorial(data.historial || []);
    } catch (err) { toast.error("Error al cargar historial: " + err.message); }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data.usuarios || []);
    } catch (err) { toast.error("Error al cargar usuarios: " + err.message); }
  };

  useEffect(() => {
    if (seccion === "mesas")     cargarMesas();
    if (seccion === "historial") cargarHistorial();
    if (seccion === "usuarios")  cargarUsuarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion]);

  // Polling de mesas cada 10s
  useEffect(() => {
    const id = setInterval(cargarMesas, 10000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SEGURIDAD ────────────────────────────────────────────────
  useBeforeUnload(cajaAbierta);
  useBlockBack(true, useCallback(() => setModalSalida(true), []));

  const manejarSalida   = () => cajaAbierta ? setModalSalida(true) : ejecutarLogout();
  const ejecutarLogout  = async () => { await logout(); navigate("/login", { replace: true }); };

  // ── CAJA ──────────────────────────────────────────────────────
  const handleAbrirCaja = async (monto) => {
    try {
      await cajaService.abrir(monto);
      await cargarCaja();
      setSeccion("dashboard");
      toast.exito(`Caja abierta con ${COP(monto)}`);
    } catch (err) { toast.error(err.message); }
  };

  // Devuelve el resultado para que Caja.jsx pueda descargar el PDF
  const handleCerrarCaja = async () => {
    try {
      const res = await cajaService.cerrar();
      setCajaAbierta(false);
      setCaja(null);
      toast.exito("Caja cerrada. PDF generado.");
      await cargarHistorial();
      setSeccion("historial");
      return res; // { ok, total_ventas, pdf }
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  const handleToggleServicio = () => {
    setServicioActivo(v => !v);
    toast.info(servicioActivo ? "Servicio pausado" : "Servicio activado");
  };

  // ── MESAS ────────────────────────────────────────────────────
  const handleCrearMesa = async (nombre) => {
    try {
      await mesaService.crear(nombre);
      await cargarMesas();
      toast.exito(`"${nombre}" creada`);
    } catch (err) { toast.error(err.message); }
  };

  const handleEliminarMesa = async (id) => {
    try {
      await mesaService.eliminar(id);
      await cargarMesas();
      toast.advertencia("Mesa eliminada");
    } catch (err) { toast.error(err.message); }
  };

  const handleModificarItem = async (mesa, item_id, delta) => {
    const item = mesa.pedido.find(i => i.item_id === item_id);
    if (!item) return;
    try {
      await pedidoService.updateItem(item_id, item.cantidad + delta);
      await cargarMesas();
    } catch (err) { toast.error(err.message); }
  };

  const handlePagoTotal = async (mesa, metodo) => {
    if (!cajaAbierta) { toast.error("Abre la caja antes de registrar pagos."); return; }
    try {
      await cajaService.registrarPago({
        mesa_id: mesa.id, mesa_nombre: mesa.nombre,
        pedido_id: mesa.pedido[0]?.pedido_id || null,
        total: mesa.total, metodo_pago: metodo,
        items: mesa.pedido.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
      });
      await cargarMesas();
      await cargarCaja();
      toast.exito(`Pago: ${COP(mesa.total)} — ${metodo}`);
    } catch (err) { toast.error(err.message); }
  };

  const handlePagoParcial = async (mesa, items, metodo) => {
    if (!cajaAbierta) { toast.error("Abre la caja antes de registrar pagos."); return; }
    try {
      const total = items.reduce((a, i) => a + i.precio * i.cantidad, 0);
      await cajaService.registrarPago({
        mesa_id: mesa.id, mesa_nombre: mesa.nombre,
        pedido_id: null, total, metodo_pago: metodo,
        items: items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
      });
      for (const item of items) await pedidoService.updateItem(item.item_id, 0);
      await cargarMesas();
      await cargarCaja();
      toast.exito(`Pago parcial: ${COP(total)} — ${metodo}`);
    } catch (err) { toast.error(err.message); }
  };

  // ── USUARIOS ────────────────────────────────────────────────
  const handleCrearUsuario = async ({ correo, password, rol }) => {
    try {
      await usuarioService.crear({ correo, password, rol });
      await cargarUsuarios();
      toast.exito(`Usuario ${correo} creado`);
    } catch (err) { toast.error(err.message); }
  };

const handleEliminarUsuario = async (id) => {
  const res = await usuarioService.eliminar(id);
  // Si llegamos aquí, el backend respondió OK
  await cargarUsuarios(); // recargar lista desde la API
  toast.advertencia("Usuario eliminado");
  return res;
};

  if (cargandoDatos) {
    return (
      <div className="cargando-pantalla">
        <span className="cargando-logo">◆</span>
        <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <ToastContainer toasts={toasts} remover={remover} />

      <Navbar
        seccion={seccion} setSeccion={setSeccion}
        servicioActivo={servicioActivo} onSalir={manejarSalida}
      />

      <main className="admin-main">
        {seccion === "dashboard" && (
          <Dashboard cajaAbierta={cajaAbierta} />
        )}
        {seccion === "inicio" && (
          <Caja
            cajaAbierta={cajaAbierta} caja={caja}
            servicioActivo={servicioActivo}
            onAbrirCaja={handleAbrirCaja}
            onCerrarCaja={handleCerrarCaja}
            onToggleServicio={handleToggleServicio}
          />
        )}
        {seccion === "mesas" && (
          <Mesas
            mesas={mesas} cajaAbierta={cajaAbierta}
            onCrearMesa={handleCrearMesa}
            onEliminarMesa={handleEliminarMesa}
            onModificarItem={handleModificarItem}
            onPagoTotal={handlePagoTotal}
            onPagoParcial={handlePagoParcial}
          />
        )}
        {seccion === "egresos" && (
          <Egresos
            cajaAbierta={cajaAbierta}
            onEgresoCreado={() => {}} // Dashboard se refresca solo con polling
          />
        )}
        {seccion === "historial" && <Historial historial={historial} />}
        {seccion === "usuarios"  && (
          <Usuarios
            usuarios={usuarios}
            onCrearUsuario={handleCrearUsuario}
            onEliminarUsuario={handleEliminarUsuario}
          />
        )}
        {seccion === "sesiones" && (
          <SesionesActivas toast={toast} />
        )}
      </main>

      <Modal
        abierto={modalSalida} titulo="¿Seguro que deseas salir?"
        variante="peligro" labelConfirmar="Sí, cerrar sesión" labelCancelar="Quedarme"
        onConfirmar={ejecutarLogout} onCancelar={() => setModalSalida(false)}
      >
        <p className="texto-secundario">
          {cajaAbierta
            ? "⚠️ La caja está abierta. Tus datos están guardados en el servidor."
            : "Estás a punto de cerrar tu sesión."}
        </p>
      </Modal>
    </div>
  );
};

const COP = (n) => `$${(parseFloat(n)||0).toLocaleString("es-CO")}`;

export default AdminDashboard;