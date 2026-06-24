// frontend/src/pages/AdminDashboard.jsx — versión final completa
// ============================================================================
// ADMIN DASHBOARD - PANEL DE CONTROL PRINCIPAL DEL RESTAURANTE
// ============================================================================
// Este componente es el corazón del sistema de administración. Gestiona:
// - Mesas y pedidos
// - Caja y pagos
// - Usuarios del sistema
// - Historial de ventas
// - Egresos y gastos
// - Stock e inventario
// - Quejas y reclamos
// - Sesiones activas
// ============================================================================

import { useState, useEffect, useCallback } from "react";
// useState: Maneja el estado del componente (sección activa, datos, modales)
// useEffect: Ejecuta efectos secundarios (carga inicial, polling, etc)
// useCallback: Memoriza funciones para optimizar rendimiento

import { useNavigate } from "react-router-dom";
// useNavigate: Permite navegar entre páginas (redirección después de logout)

import { useAuth } from "../context/AuthContext";
// useAuth: Hook personalizado que proporciona:
//   - usuario: Datos del usuario autenticado
//   - logout: Función para cerrar sesión

import { useBeforeUnload, useBlockBack } from "../hooks/useBeforeUnload";
// useBeforeUnload: Muestra alerta al intentar cerrar/recargar pestaña
// useBlockBack: Bloquea el botón "atrás" del navegador

import { useToast } from "../hooks/useToast";
// useToast: Hook para notificaciones emergentes (toasts)
//   - toasts: Array de notificaciones activas
//   - remover: Función para eliminar una notificación
//   - toast: Objeto con métodos: exito(), error(), info(), advertencia()

import { mesaService } from "../services/mesaService";
// mesaService: Servicio API para operaciones con mesas
//   - getAll(): Obtener todas las mesas
//   - crear(): Crear nueva mesa
//   - eliminar(): Eliminar mesa por ID

import { pedidoService } from "../services/pedidoService";
// pedidoService: Servicio API para operaciones con pedidos
//   - updateItem(): Actualizar cantidad de un producto
//   - deleteItem(): Eliminar producto del pedido
//   - moverItems(): Mover productos entre mesas

import { cajaService } from "../services/cajaService";
// cajaService: Servicio API para operaciones de caja
//   - getEstado(): Obtener estado actual de la caja
//   - abrir(): Abrir nueva caja
//   - cerrar(): Cerrar caja y generar PDF
//   - getHistorial(): Obtener historial de ventas
//   - registrarPago(): Registrar un pago

import { usuarioService } from "../services/usuarioService";
// usuarioService: Servicio API para operaciones con usuarios
//   - getAll(): Obtener todos los usuarios
//   - crear(): Crear nuevo usuario
//   - eliminar(): Eliminar usuario por ID

// Componentes hijos del panel de administración
import Quejas from "../components/admin/Quejas";
// Quejas: Componente para gestionar reclamos y sugerencias de clientes

import Navbar from "../components/admin/Navbar";
// Navbar: Barra de navegación lateral/superior con opciones del menú

import Dashboard from "../components/admin/Dashboard";
// Dashboard: Vista principal con métricas y resumen del día

import Caja from "../components/admin/Caja";
// Caja: Componente para abrir/cerrar caja y gestionar servicio

import Mesas from "../components/admin/Mesas";
// Mesas: Componente principal para gestionar mesas y pedidos

import Egresos from "../components/admin/Egresos";
// Egresos: Componente para registrar gastos y salidas de dinero

import Historial from "../components/admin/Historial";
// Historial: Componente que muestra el historial de ventas y cierres

import Usuarios from "../components/admin/Usuarios";
// Usuarios: Componente para CRUD de usuarios del sistema

import SesionesActivas from "../components/admin/SesionesActivas";
// SesionesActivas: Componente que muestra usuarios conectados actualmente

import ToastContainer from "../components/admin/ToastContainer";
// ToastContainer: Contenedor que renderiza las notificaciones emergentes

import Modal from "../components/admin/Modal";
// Modal: Ventana modal reutilizable para confirmaciones

import Stock from "../components/admin/Stock";
// Stock: Componente para gestionar inventario y productos

import "./Admin.css";
// Estilos específicos del panel de administración

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminDashboard = () => {
  // --------------------------------------------------------------------------
  // HOOKS Y CONTEXTOS
  // --------------------------------------------------------------------------
  const navigate = useNavigate();
  // Redirecciona a otras rutas (ej: "/login" después de logout)

  const { usuario, logout } = useAuth();
  // usuario: Objeto con datos del admin logueado
  // logout: Función asíncrona que cierra la sesión en el backend

  const { toasts, remover, toast } = useToast();
  // toasts: Array [{ id, mensaje, tipo }]
  // remover(id): Elimina un toast específico
  // toast.exito(), toast.error(), toast.info(), toast.advertencia()

  // --------------------------------------------------------------------------
  // ESTADOS DE LA INTERFAZ
  // --------------------------------------------------------------------------
  const [seccion, setSeccion] = useState("dashboard");
  // Controla qué vista se muestra actualmente
  // Valores posibles: "dashboard", "inicio", "mesas", "egresos", "stock",
  // "historial", "quejas", "usuarios", "sesiones"

  const [modalSalida, setModalSalida] = useState(false);
  // Controla la visibilidad del modal de confirmación de salida
  // true = modal visible, false = modal oculto

  const [servicioActivo, setServicioActivo] = useState(true);
  // Estado del servicio del restaurante
  // true = atendiendo clientes, false = servicio pausado

  // --------------------------------------------------------------------------
  // ESTADOS DE DATOS
  // --------------------------------------------------------------------------
  const [mesas, setMesas] = useState([]);
  // Array de mesas con sus pedidos
  // Estructura: [{ id, nombre, pedido: [{ item_id, nombre, cantidad, precio }], total }]

  const [cajaAbierta, setCajaAbierta] = useState(false);
  // Indica si hay una caja abierta actualmente
  // true = caja operativa, false = caja cerrada

  const [caja, setCaja] = useState(null);
  // Objeto con detalles de la caja actual
  // Estructura: { id, monto_inicial, monto_actual, fecha_apertura }

  const [historial, setHistorial] = useState([]);
  // Array con el historial de cierres de caja y ventas

  const [usuarios, setUsuarios] = useState([]);
  // Array de usuarios del sistema (solo visible para admins)

  const [cargandoDatos, setCargandoDatos] = useState(true);
  // Estado de carga inicial
  // true = mostrando pantalla de carga, false = contenido visible

  // ==========================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // CARGA INICIAL - SE EJECUTA AL MONTAR EL COMPONENTE
  // --------------------------------------------------------------------------
  useEffect(() => {
    cargarDatosIniciales();
    // Muestra un saludo personalizado con el nombre del usuario
    // usuario?.correo?.split("@")[0] extrae la parte antes del @ del email
    toast.info(`Hola, ${usuario?.correo?.split("@")[0]} 👋`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío = solo se ejecuta una vez al montar

  // --------------------------------------------------------------------------
  // CARGA PARALELA DE DATOS INICIALES
  // --------------------------------------------------------------------------
  const cargarDatosIniciales = async () => {
    setCargandoDatos(true); // Activa pantalla de carga
    // Promise.all ejecuta ambas peticiones en paralelo (más rápido)
    await Promise.all([cargarMesas(), cargarCaja()]);
    setCargandoDatos(false); // Oculta pantalla de carga
  };

  // --------------------------------------------------------------------------
  // CARGAR MESAS DESDE EL SERVIDOR
  // --------------------------------------------------------------------------
  const cargarMesas = async () => {
    try {
      const data = await mesaService.getAll();
      // data.mesas contiene el array de mesas, si no existe usa array vacío
      setMesas(data.mesas || []);
    } catch (err) {
      toast.error("Error al cargar mesas: " + err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CARGAR ESTADO DE LA CAJA
  // --------------------------------------------------------------------------
  const cargarCaja = async () => {
    try {
      const data = await cajaService.getEstado();
      setCajaAbierta(data.abierta); // boolean: true si hay caja abierta
      setCaja(data.caja); // objeto con detalles de la caja o null
    } catch (err) {
      toast.error("Error al cargar caja: " + err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CARGAR HISTORIAL DE VENTAS
  // --------------------------------------------------------------------------
  const cargarHistorial = async () => {
    try {
      const data = await cajaService.getHistorial();
      setHistorial(data.historial || []);
    } catch (err) {
      toast.error("Error al cargar historial: " + err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CARGAR USUARIOS DEL SISTEMA
  // --------------------------------------------------------------------------
  const cargarUsuarios = async () => {
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      toast.error("Error al cargar usuarios: " + err.message);
    }
  };

  // ==========================================================================
  // EFECTOS SECUNDARIOS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // CARGA DE DATOS POR SECCIÓN
  // --------------------------------------------------------------------------
  // Cuando el usuario cambia de sección, se cargan los datos específicos
  useEffect(() => {
    if (seccion === "mesas") cargarMesas(); // Actualiza mesas al entrar
    if (seccion === "historial") cargarHistorial(); // Carga historial
    if (seccion === "usuarios") cargarUsuarios(); // Carga usuarios
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccion]); // Se ejecuta cada vez que cambia 'seccion'

  // --------------------------------------------------------------------------
  // POLLING - ACTUALIZACIÓN AUTOMÁTICA DE MESAS
  // --------------------------------------------------------------------------
  // Actualiza las mesas automáticamente cada 10 segundos
  // Útil para reflejar cambios hechos por otros usuarios (cajeros)
  useEffect(() => {
    const id = setInterval(cargarMesas, 10000); // 10000ms = 10 segundos
    return () => clearInterval(id); // Limpia el intervalo al desmontar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se configura una vez

  // ==========================================================================
  // SEGURIDAD Y NAVEGACIÓN
  // ==========================================================================

  // --------------------------------------------------------------------------
  // HOOKS DE SEGURIDAD
  // --------------------------------------------------------------------------
  // Previene cierre accidental de pestaña si la caja está abierta
  useBeforeUnload(cajaAbierta);

  // Bloquea el botón "atrás" del navegador y muestra modal de confirmación
  // useCallback evita recrear la función en cada renderizado
  useBlockBack(true, useCallback(() => setModalSalida(true), []));

  // --------------------------------------------------------------------------
  // MANEJO DE SALIDA
  // --------------------------------------------------------------------------
  // Decide si mostrar el modal o hacer logout directo
  const manejarSalida = () =>
    cajaAbierta ? setModalSalida(true) : ejecutarLogout();

  // --------------------------------------------------------------------------
  // EJECUTAR LOGOUT
  // --------------------------------------------------------------------------
  const ejecutarLogout = async () => {
    await logout(); // Limpia el token y datos de autenticación
    navigate("/login", { replace: true }); // Redirige al login (replace evita volver atrás)
  };

  // ==========================================================================
  // FUNCIONES DE CAJA
  // ==========================================================================

  // --------------------------------------------------------------------------
  // ABRIR CAJA
  // --------------------------------------------------------------------------
  const handleAbrirCaja = async (monto) => {
    try {
      await cajaService.abrir(monto);
      await cargarCaja(); // Recarga el estado actualizado
      setSeccion("dashboard"); // Vuelve al dashboard automáticamente
      toast.exito(`Caja abierta con ${COP(monto)}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CERRAR CAJA
  // --------------------------------------------------------------------------
  // Devuelve el resultado para que Caja.jsx pueda descargar el PDF
  const handleCerrarCaja = async () => {
    try {
      const res = await cajaService.cerrar();
      setCajaAbierta(false); // Marca caja como cerrada
      setCaja(null); // Limpia los datos de la caja
      toast.exito("Caja cerrada. PDF generado.");
      await cargarHistorial(); // Actualiza el historial
      setSeccion("historial"); // Cambia a la vista de historial
      return res; // { ok, total_ventas, pdf } para descargar el reporte
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  // --------------------------------------------------------------------------
  // TOGGLE SERVICIO (Pausar/Activar)
  // --------------------------------------------------------------------------
  const handleToggleServicio = () => {
    setServicioActivo((v) => !v); // Invierte el estado actual
    toast.info(servicioActivo ? "Servicio pausado" : "Servicio activado");
  };

  // ==========================================================================
  // FUNCIONES DE MESAS Y PEDIDOS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // CREAR MESA
  // --------------------------------------------------------------------------
  const handleCrearMesa = async (nombre, zona_id = null) => {
    try {
      await mesaService.crear({
        nombre, // Nombre de la mesa (ej: "Mesa 1", "Barra 2")
        zona_id, // ID de la zona (barra, terraza, interior, etc)
        capacidad: 4, // Capacidad predeterminada
        pos_x: 20, // Posición X en el plano visual
        pos_y: 20, // Posición Y en el plano visual
        forma: "cuadrada", // Forma visual de la mesa
      });
      await cargarMesas(); // Recarga la lista actualizada
      toast.exito(`"${nombre}" creada`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // ELIMINAR MESA
  // --------------------------------------------------------------------------
  const handleEliminarMesa = async (id) => {
    try {
      await mesaService.eliminar(id);
      await cargarMesas();
      toast.advertencia("Mesa eliminada");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // MODIFICAR CANTIDAD DE UN PRODUCTO
  // --------------------------------------------------------------------------
  const handleModificarItem = async (mesa, item_id, delta) => {
    // Busca el item en el pedido de la mesa
    const item = mesa.pedido.find((i) => i.item_id === item_id);
    if (!item) return; // Si no existe, no hace nada

    const nuevaCantidad = item.cantidad + delta; // delta es +1 o -1
    if (nuevaCantidad <= 0) return; // No permite cantidades negativas

    try {
      await pedidoService.updateItem(item_id, nuevaCantidad);
      await cargarMesas(); // Recarga para mostrar el cambio
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // ELIMINAR PRODUCTO DEL PEDIDO
  // --------------------------------------------------------------------------
  const handleEliminarItem = async (mesa, item_id) => {
    try {
      await pedidoService.deleteItem(item_id); // Elimina el item por su ID
      await cargarMesas(); // Recarga la lista actualizada
      toast.advertencia("Producto eliminado del pedido");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // MOVER PRODUCTOS ENTRE MESAS
  // --------------------------------------------------------------------------
  const handleMoverItems = async (items, mesaDestinoId) => {
    try {
      // items es un array de objetos que tienen la propiedad item_id
      await pedidoService.moverItems(
        items.map((i) => i.item_id), // Extrae solo los IDs
        mesaDestinoId
      );
      await cargarMesas(); // Recarga ambas mesas actualizadas
      toast.exito(`${items.length} producto(s) movidos correctamente`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // PAGO TOTAL DE LA MESA
  // --------------------------------------------------------------------------
  const handlePagoTotal = async (mesa, metodo) => {
    // Validación: la caja debe estar abierta para registrar pagos
    if (!cajaAbierta) {
      toast.error("Abre la caja antes de registrar pagos.");
      return;
    }

    try {
      await cajaService.registrarPago({
        mesa_id: mesa.id,
        mesa_nombre: mesa.nombre,
        pedido_id: mesa.pedido[0]?.pedido_id || null, // ID del pedido (si existe)
        total: mesa.total, // Monto total a pagar
        metodo_pago: metodo, // "efectivo", "tarjeta", "transferencia", etc
        items: mesa.pedido.map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio,
        })),
      });
      await cargarMesas(); // Limpia los productos de la mesa pagada
      await cargarCaja(); // Actualiza el monto en caja
      toast.exito(`Pago: ${COP(mesa.total)} — ${metodo}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // PAGO PARCIAL (Solo algunos productos)
  // --------------------------------------------------------------------------
  const handlePagoParcial = async (mesa, items, metodo) => {
    // Validación: la caja debe estar abierta
    if (!cajaAbierta) {
      toast.error("Abre la caja antes de registrar pagos.");
      return;
    }

    try {
      // Calcula el total de los productos seleccionados
      const total = items.reduce((a, i) => a + i.precio * i.cantidad, 0);

      await cajaService.registrarPago({
        mesa_id: mesa.id,
        mesa_nombre: mesa.nombre,
        pedido_id: null, // Pago parcial no tiene pedido asociado
        total: total,
        metodo_pago: metodo,
        items: items.map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio,
        })),
      });

      // Elimina los productos pagados del pedido (cantidad = 0)
      for (const item of items) {
        await pedidoService.updateItem(item.item_id, 0);
      }

      await cargarMesas(); // Actualiza la mesa
      await cargarCaja(); // Actualiza la caja
      toast.exito(`Pago parcial: ${COP(total)} — ${metodo}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ==========================================================================
  // FUNCIONES DE USUARIOS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // CREAR USUARIO
  // --------------------------------------------------------------------------
  const handleCrearUsuario = async ({ correo, password, rol }) => {
    try {
      await usuarioService.crear({ correo, password, rol });
      await cargarUsuarios(); // Recarga la lista actualizada
      toast.exito(`Usuario ${correo} creado`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // ELIMINAR USUARIO
  // --------------------------------------------------------------------------
  const handleEliminarUsuario = async (id) => {
    const res = await usuarioService.eliminar(id);
    await cargarUsuarios(); // Recarga la lista actualizada
    toast.advertencia("Usuario eliminado");
    return res; // Devuelve la respuesta por si se necesita
  };

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  // --------------------------------------------------------------------------
  // PANTALLA DE CARGA
  // --------------------------------------------------------------------------
  // Se muestra mientras se cargan los datos iniciales
  if (cargandoDatos) {
    return (
      <div className="cargando-pantalla">
        <span className="cargando-logo">◆</span>
        <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
          Cargando panel...
        </p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER PRINCIPAL
  // --------------------------------------------------------------------------
  return (
    <div className="admin-container">
      {/* =====================================================================
          CONTENEDOR DE NOTIFICACIONES (TOASTS)
          ===================================================================== */}
      <ToastContainer toasts={toasts} remover={remover} />

      {/* =====================================================================
          BARRA DE NAVEGACIÓN
          ===================================================================== */}
      <Navbar
        seccion={seccion}
        setSeccion={setSeccion}
        servicioActivo={servicioActivo}
        onSalir={manejarSalida}
      />

      {/* =====================================================================
          CONTENIDO PRINCIPAL - RENDERIZADO CONDICIONAL POR SECCIÓN
          ===================================================================== */}
      <main className="admin-main">
        {/* SECCIÓN: DASHBOARD - Panel de control con métricas */}
        {seccion === "dashboard" && <Dashboard cajaAbierta={cajaAbierta} />}

        {/* SECCIÓN: INICIO / CAJA - Gestión de caja y servicio */}
        {seccion === "inicio" && (
          <Caja
            cajaAbierta={cajaAbierta}
            caja={caja}
            servicioActivo={servicioActivo}
            onAbrirCaja={handleAbrirCaja}
            onCerrarCaja={handleCerrarCaja}
            onToggleServicio={handleToggleServicio}
          />
        )}

        {/* SECCIÓN: MESAS - Gestión completa de mesas y pedidos */}
        {seccion === "mesas" && (
          <Mesas
            mesas={mesas}
            cajaAbierta={cajaAbierta}
            onCrearMesa={handleCrearMesa}
            onEliminarMesa={handleEliminarMesa}
            onModificarItem={handleModificarItem}
            onEliminarItem={handleEliminarItem}
            onMoverItems={handleMoverItems}
            onPagoTotal={handlePagoTotal}
            onPagoParcial={handlePagoParcial}
            onRecargar={cargarMesas} // Función para recargar manual desde el plano
            toast={toast}
          />
        )}

        {/* SECCIÓN: EGRESOS - Registrar gastos del restaurante */}
        {seccion === "egresos" && (
          <Egresos
            cajaAbierta={cajaAbierta}
            onEgresoCreado={() => {}} // Callback vacío (no se necesita acción adicional)
          />
        )}

        {/* SECCIÓN: STOCK - Gestión de inventario y productos */}
        {seccion === "stock" && <Stock toast={toast} />}

        {/* SECCIÓN: HISTORIAL - Reportes de ventas pasadas */}
        {seccion === "historial" && <Historial historial={historial} />}

        {/* SECCIÓN: QUEJAS - Gestión de reclamos de clientes */}
        {seccion === "quejas" && <Quejas toast={toast} />}

        {/* SECCIÓN: USUARIOS - CRUD de usuarios del sistema */}
        {seccion === "usuarios" && (
          <Usuarios
            usuarios={usuarios}
            onCrearUsuario={handleCrearUsuario}
            onEliminarUsuario={handleEliminarUsuario}
          />
        )}

        {/* SECCIÓN: SESIONES - Usuarios conectados actualmente */}
        {seccion === "sesiones" && <SesionesActivas toast={toast} />}
      </main>

      {/* =====================================================================
          MODAL DE CONFIRMACIÓN DE SALIDA
          ===================================================================== */}
      <Modal
        abierto={modalSalida}
        titulo="¿Seguro que deseas salir?"
        variante="peligro" // Estilo rojo de advertencia
        labelConfirmar="Sí, cerrar sesión"
        labelCancelar="Quedarme"
        onConfirmar={ejecutarLogout}
        onCancelar={() => setModalSalida(false)}
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

// ============================================================================
// FUNCIÓN AUXILIAR: FORMATEADOR DE MONEDA COLOMBIANA
// ============================================================================
// Convierte un número a formato de pesos colombianos
// Ejemplos:
//   COP(15000)  → "$15.000"
//   COP(1234567) → "$1.234.567"
//   COP(null)   → "$0"
const COP = (n) => `$${(parseFloat(n) || 0).toLocaleString("es-CO")}`;

// ============================================================================
// EXPORTACIÓN DEL COMPONENTE
// ============================================================================
export default AdminDashboard;