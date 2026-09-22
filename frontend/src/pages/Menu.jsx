// ============================================================
// Menu.jsx — Página principal del menú del restaurante
// ============================================================
// Este es el componente más grande e importante del proyecto.
// Se encarga de mostrarle al cliente TODO lo relacionado con
// el menú: categorías, productos, carrito de compras, búsqueda,
// favoritos y el formulario de quejas/sugerencias.
//
// También permite a los administradores agregar y editar
// productos directamente desde la interfaz del cliente — pero
// SOLO si están logueados como admin del restaurante que están
// viendo (ver `esAdmin` más abajo).
//
// 🧹 LIMPIEZA: este componente ya NO depende de imágenes
// empaquetadas localmente (data/imagenes.js). Todas las
// imágenes de productos/categorías vienen como URL de Cloudinary
// guardada directamente en la BD. Tampoco existe ya un "menú
// demo" quemado — cada restaurante (incluido el que antes era
// el demo) empieza vacío y el admin construye su propia carta.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./Menu.css";
import FoodCard from "../components/FoodCard";
import { API_URL } from "../services/config";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import ImageUploadField from "../components/ImageUploadField";
import { useBlockBack } from "../hooks/useBeforeUnload";

// ── Íconos por categoría ─────────────────────────────────────
// Se usan como fallback visual (círculo + emoji) cuando la
// categoría todavía no tiene una imagen propia en Cloudinary.
const catIconos = {
  "Platos fuertes": "🍽️",
  "Entradas":       "🥗",
  "Platos típicos": "🫕",
  "Bar":            "🍹",
  "Bebidas":        "🍹",
  "Pastas":         "🍝",
  "Cortes":         "🥩",
  "Sushi":          "🍣",
  "Comida Vegana":  "🌱",
  "Quesos":         "🧀",
};

// ── Degradados por categoría ─────────────────────────────────
// Igual que los íconos: fallback visual mientras no haya imagen.
const catGradientes = {
  "Platos fuertes": "linear-gradient(135deg,#7c2d12,#f97316)",
  "Entradas":       "linear-gradient(135deg,#14532d,#4ade80)",
  "Platos típicos": "linear-gradient(135deg,#78350f,#f59e0b)",
  "Bar":            "linear-gradient(135deg,#581c87,#d946ef)",
  "Bebidas":        "linear-gradient(135deg,#581c87,#d946ef)",
  "Pastas":         "linear-gradient(135deg,#713f12,#facc15)",
  "Cortes":         "linear-gradient(135deg,#7f1d1d,#ef4444)",
  "Sushi":          "linear-gradient(135deg,#134e4a,#2dd4bf)",
  "Comida Vegana":  "linear-gradient(135deg,#14532d,#22c55e)",
  "Quesos":         "linear-gradient(135deg,#713f12,#fbbf24)",
};
const catGradienteDefault = "linear-gradient(135deg,#292524,#78716c)";

// ── Paginación ─────────────────────────────────────────────
const ITEMS_PAGE_SIZE = 6;
const CATS_PAGE_SIZE  = 4;

// ── Constantes del Bar ───────────────────────────────────────
const BAR_CATS  = ["Bar", "Bebidas"];
const BAR_SUBS  = ["Licores","Cervezas","Jugos","Micheladas","Gaseosas","Malteadas"];
const BAR_ICONS = { Licores:"🥃", Cervezas:"🍺", Jugos:"🍊", Micheladas:"🍻", Gaseosas:"🥤", Malteadas:"🍦" };

// TERMINOS: opciones de cocción para los cortes de carne.
const TERMINOS  = ["Poco hecho","Término medio","Bien hecho","Muy bien hecho"];

// fmtCOP: función auxiliar para formatear números como precios en COP
const fmtCOP = n =>
  `$${Math.round(Number(n) || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  // "62.500", "62,500", "$62.500", "62500" → 62500
const parseCOP = v => Number(String(v ?? "").replace(/\D/g, "")) || 0;

// resolveImg: la imagen SIEMPRE es una URL de Cloudinary (o null si el
// producto/categoría no tiene foto todavía). Ya no hay bundle estático
// al que caer, así que esto es prácticamente un passthrough.
const resolveImg = (valorImagen) => valorImagen || null;


// ============================================================
// Componente: ProductModal
// ============================================================
// 👈 Nota: este modal es SOLO para el cliente final (ver detalle
// del plato y agregarlo al carrito). No necesita saber nada de
// admin/tenant, por eso NO lleva useAuth ni esAdmin aquí dentro.
const ProductModal = ({ item, onClose, onAddToCart }) => {
  const [termino,     setTermino]     = useState(null);
  const [opcionesSel, setOpcionesSel] = useState([]);
  const [adiciones,   setAdiciones]   = useState([]);

  if (!item) return null;

  const opciones      = item.opciones  || [];
  const adicionesDisp = item.adiciones || [];

  const toggleAdicion = nombre =>
    setAdiciones(prev => prev.includes(nombre) ? prev.filter(a=>a!==nombre) : [...prev,nombre]);

  const toggleOpcion = nombre =>
    setOpcionesSel(prev => prev.includes(nombre) ? prev.filter(o=>o!==nombre) : [...prev,nombre]);

  const precioAdiciones = adicionesDisp
    .filter(a => adiciones.includes(a.nombre))
    .reduce((s,a) => s + Number(a.precio), 0);

  const precioOpciones = opciones
    .filter(o => opcionesSel.includes(o.nombre))
    .reduce((s,o) => s + Number(o.precio), 0);

  const precioTotal = Number(item.precio || 0) + precioOpciones + precioAdiciones;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {item.img
          ? <div className="product-modal-img-wrap">
              <img src={item.img} alt={item.nombre} className="product-modal-img" />
            </div>
          : <div className="product-modal-img-placeholder">
              {catIconos[item.categoria] || "🍽️"}
            </div>
        }

        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="product-modal-body">
          <div className="product-modal-header">
            <h2 className="product-modal-title">{item.nombre}</h2>
            <span className="product-modal-price">{fmtCOP(precioTotal)}</span>
          </div>

          <p className="product-modal-desc">
            {item.descripcion || "Delicioso plato preparado con los mejores ingredientes."}
          </p>

          {item.tiene_termino && (
            <div className="modal-section">
              <p className="modal-section-title">🥩 Término de cocción</p>
              <div className="termino-options">
                {TERMINOS.map(t => (
                  <button key={t} className={`termino-btn ${termino===t?"selected":""}`} onClick={()=>setTermino(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {opciones.length > 0 && (
            <div className="modal-section">
              <p className="modal-section-title">🍟 ¿Con qué lo acompañas?</p>
              {opciones.map((op,i) => (
                <div key={i} className={`opcion-row ${opcionesSel.includes(op.nombre)?"selected":""}`} onClick={()=>toggleOpcion(op.nombre)}>
                  <span className="opcion-label">
                    <span className="opcion-radio"><span className="opcion-radio-dot"/></span>
                    {op.nombre}
                  </span>
                  <span className={`opcion-precio ${Number(op.precio)>0?"pagado":""}`}>
                    {Number(op.precio)>0 ? `+${fmtCOP(op.precio)}` : "Incluido"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {adicionesDisp.length > 0 && (
            <div className="modal-section">
              <p className="modal-section-title">➕ Adiciones</p>
              {adicionesDisp.map((ad,i) => (
                <div key={i} className={`adicion-row ${adiciones.includes(ad.nombre)?"selected":""}`} onClick={()=>toggleAdicion(ad.nombre)}>
                  <span className="adicion-check">{adiciones.includes(ad.nombre)?"✓":""}</span>
                  <span className="adicion-label">{ad.nombre}</span>
                  <span className="adicion-precio">+{fmtCOP(ad.precio)}</span>
                </div>
              ))}
            </div>
          )}

          <button className="modal-add-btn" onClick={() => { onAddToCart({ ...item, precio: precioTotal, termino, opcion: opcionesSel, adiciones }); onClose(); }}>
            Agregar al pedido — {fmtCOP(precioTotal)}
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// Componente principal: Menu
// ============================================================
const Menu = () => {
  const navigate = useNavigate();

  // ── SaaS: restaurante y mesa vienen de la URL ─────────────
  const { restauranteId, mesaId } = useParams();
    const [searchParams] = useSearchParams();
  const qrToken = searchParams.get("t");

  // ── Sesión actual (puede ser null si es un cliente sin login) ──
  const { usuario } = useAuth();

  // 👇 Solo es "admin editor" si está logueado como admin Y el
  // restaurante del token coincide con el restaurante que está
  // viendo. Esto evita que un admin del restaurante 1 vea botones
  // de editar si entra a /menu/2/... del restaurante 2.
  const esAdmin = usuario?.rol === "admin" && String(usuario?.restaurante_id) === String(restauranteId);

  // ── Estados de navegación ──────────────────────────────────
  const [categoria,    setCategoria]    = useState(null);
  const [subCategoria, setSubCategoria] = useState(null);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [activeTab,    setActiveTab]    = useState("home");

  // ── Estado del menú (datos) ────────────────────────────────
  const [menuDB, setMenuDB] = useState({});

  // ── Estados del carrito ────────────────────────────────────
  const [cartOpen, setCartOpen] = useState(false);
  const [cart,     setCart]     = useState([]);
  const [pagado,   setPagado]   = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  // ── Estado del modal de producto ──────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Estado de favoritos ────────────────────────────────────
  const [favs, setFavs] = useState([]);

  // ── Estados de paginación ──────────────────────────────────
  const [sectionPage, setSectionPage] = useState({});
  const [catsPage, setCatsPage] = useState(1);
  const productosRef = useRef(null);
    const [pedidosMesa, setPedidosMesa] = useState([]); // lo ya pedido en esta mesa (cocina, no pagado aún)
    const [pedidosBarMesa, setPedidosBarMesa] = useState([]); // lo ya pedido en esta mesa (bar, no pagado aún)
    const [accesoInvalido, setAccesoInvalido] = useState(false); // 🔒 true si el QR/token ya no es válido

  // ── Estados del formulario de quejas ──────────────────────
  const [quejaMsg,     setQuejaMsg]     = useState("");
  const [quejaMesa,    setQuejaMesa]    = useState("");
  const [quejaSent,    setQuejaSent]    = useState(false);
  const [quejaLoading, setQuejaLoading] = useState(false);

  // ── Estado de búsqueda ────────────────────────────────────
  const [searchText, setSearchText] = useState("");

  // ── Estados del modal "Agregar producto" (admin) ──────────
  const [addModal,      setAddModal]      = useState(false);
  const [categoriasBD,  setCategoriasBD]  = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "", descripcion: "", precio: "", categoria_id: "",
    _catNombre: "", subcategoria: "", imagen: "", adiciones: []
  });
  const [nuevaAdicion, setNuevaAdicion] = useState({ nombre: "", precio: "" });
  const [guardando,    setGuardando]    = useState(false);
  const [guardadoOk,   setGuardadoOk]  = useState(false);

  // ── Subcategorías dinámicas (según la categoría elegida en el modal) ──
  const [subcategoriasBD, setSubcategoriasBD] = useState([]);
  const [cargandoSubcats, setCargandoSubcats] = useState(false);

  // ── Mini-formularios inline: crear categoría / subcategoría al vuelo ──
  const [creandoCategoria,    setCreandoCategoria]    = useState(false);
   const [nuevaCategoria,      setNuevaCategoria]      = useState({ nombre: "", imagen: "", destino: "cocina" });
  const [guardandoCategoria,  setGuardandoCategoria]  = useState(false);
  const [creandoSubcategoria, setCreandoSubcategoria] = useState(false);
  const [nuevaSubcategoria,   setNuevaSubcategoria]   = useState({ nombre: "", imagen: "" });
  const [guardandoSubcategoria, setGuardandoSubcategoria] = useState(false);

  // ── Estados del modal "Editar producto" (admin) ───────────
  const [editModal,    setEditModal]    = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [editando,     setEditando]     = useState(false);
  const [editOk,       setEditOk]       = useState(false);


  // ── useEffect: cargar menú desde la API ───────────────────
  useEffect(() => {
    if (!restauranteId) return;
    const qs = esAdmin ? "" : `?mesa_id=${mesaId}&t=${qrToken}`;
    fetch(`${API_URL}/menu/${restauranteId}${qs}`, {
      headers: esAdmin ? { Authorization: `Bearer ${authService.getToken()}` } : {},
    })
      .then(res => {
        if (res.status === 403) {
          setAccesoInvalido(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // era un 403, ya se manejó arriba
        const organizado = {};
        data.forEach(prod => {
          const cat = prod.categoria || "Otros";
          if (!organizado[cat]) organizado[cat] = [];
          organizado[cat].push({
            id:            prod.id,
            nombre:        prod.nombre,
            img:           resolveImg(prod.imagen),
            imagen:        prod.imagen,
            disponible:    prod.disponible === undefined ? true : !!prod.disponible,
            descripcion:   prod.descripcion,
            precio:        prod.precio,
            tiene_termino: prod.tiene_termino,
            opciones:      prod.opciones  || [],
            adiciones:     prod.adiciones || [],
            subcategoria:  prod.subcategoria || null,
            categoria:     prod.categoria,
            destino:       prod.destino || "cocina",
          });
        });
        setMenuDB(organizado);
      })
      .catch(err => console.error("Error BD:", err));
  }, [restauranteId]);

  // ── Autocompletar la mesa desde la URL (viene del QR) ─────
  useEffect(() => {
    if (mesaId) setQuejaMesa(String(mesaId));
  }, [mesaId]);

  // Refuerzo: si se abre el carrito y el campo quedó vacío, lo
  // rellenamos de nuevo con el valor de la URL.
  useEffect(() => {
    if (cartOpen && !quejaMesa && mesaId) setQuejaMesa(String(mesaId));
  }, [cartOpen, mesaId, quejaMesa]);

  // ── Scroll automático: al elegir categoría, salta directo a sus productos ──
  useEffect(() => {
    if (categoria && activeTab === "menu") {
      const t = setTimeout(() => {
        productosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [categoria, subCategoria, activeTab]);


  // ── fetchPedidosMesa: trae lo que ya se ha pedido en esta mesa ───
  const fetchPedidosMesa = () => {
    if (!mesaId || !restauranteId) return;
    const tokenQs = esAdmin ? "" : `&t=${qrToken}`;
    const headers = esAdmin ? { Authorization: `Bearer ${authService.getToken()}` } : {};

    fetch(`${API_URL}/pedidos-cocina/mesa/${mesaId}?restaurante_id=${restauranteId}${tokenQs}`, { headers })
      .then(res => res.json())
      .then(data => setPedidosMesa(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar pedidos de cocina:", err));

    fetch(`${API_URL}/bar/ordenes/mesa/${mesaId}?restaurante_id=${restauranteId}${tokenQs}`, { headers })
      .then(res => res.json())
      .then(data => setPedidosBarMesa(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar pedidos de bar:", err));
  };
    // ── Bloquear el gesto/botón "atrás" para no perder el carrito ────
  // En vez de mostrar un modal de confirmación (como en el admin), acá
  // el "atrás" se comporta como en una app nativa: cierra lo que esté
  // abierto (modal de producto, carrito, sidebar) en orden de prioridad;
  // si no hay nada abierto, simplemente no deja salir del menú.
  const manejarGestoAtras = useCallback(() => {
    if (selectedItem)      { setSelectedItem(null); return; }
    if (addModal)          { setAddModal(false);    return; }
    if (editModal)         { setEditModal(false);   return; }
    if (cartOpen)          { setCartOpen(false);     return; }
    if (menuOpen)          { setMenuOpen(false);     return; }
    // No hay nada abierto: no hacemos nada más, el hook ya se encargó
    // de "absorber" el evento y quedarnos en la misma página.
  }, [selectedItem, addModal, editModal, cartOpen, menuOpen]);

  useBlockBack(true, manejarGestoAtras);

    // ── Evitar que Safari/Chrome empiecen a animar el gesto de swipe-atrás
  // en primer lugar (en vez de solo bloquear la navegación después de que
  // ya arrancó, que es lo que causaba el freeze/glitch visual). Se activa
  // solo mientras el componente Menu está montado, y se revierte al salir.
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtml = htmlEl.style.overscrollBehaviorX;
    const prevBody = bodyEl.style.overscrollBehaviorX;

    htmlEl.style.overscrollBehaviorX = "none";
    bodyEl.style.overscrollBehaviorX = "none";

    return () => {
      htmlEl.style.overscrollBehaviorX = prevHtml;
      bodyEl.style.overscrollBehaviorX = prevBody;
    };
  }, []);

  // Carga inicial al entrar al menú (y si cambia la mesa/restaurante)
  useEffect(() => {
    fetchPedidosMesa();
  }, [mesaId, restauranteId]);

  // ── dataFinal: el menú SIEMPRE es lo que hay en la BD para este
  // restaurante. Ya no existe un "restaurante demo" que caiga a datos
  // quemados — si un restaurante (incluido el que antes era el demo)
  // todavía no tiene productos, simplemente ve su carta vacía y, si
  // es admin, el botón para agregar su primer producto.
  const dataFinal = menuDB;
  const menuVacio = Object.keys(dataFinal).length === 0;

  // ── firstImg / getCatImage: imagen representativa de una categoría ──
  const firstImg = list => (list || []).find(p => p?.img)?.img || null;

  const getCatImage = cat => {
    const catData = dataFinal[cat];
    if (!catData) return null;
    if (Array.isArray(catData)) return firstImg(catData);
    for (const sub of Object.values(catData)) {
      const img = firstImg(sub);
      if (img) return img;
    }
    return null;
  };

  // ── Productos destacados en la pantalla de inicio ─────────
  // Salen siempre de los productos reales del restaurante (los
  // primeros que encuentre). Si todavía no tiene ninguno, no hay
  // nada que destacar — eso ya lo cubre `menuVacio` con el EmptyMenuState.
  const destacados = Object.values(dataFinal)
    .flatMap(val => (typeof val === "object" && !Array.isArray(val)) ? Object.values(val).flat() : (Array.isArray(val) ? val : []))
    .slice(0, 3);

  // ── addToCart: agregar producto al carrito ─────────────────
  // Ya no hay que "adivinar" una imgKey del bundle local: la imagen
  // del producto ya viaja en el propio `item` como URL de Cloudinary
  // (item.img / item.imagen), así que se guarda tal cual en el carrito.
  const addToCart = item => {
    setCart(prev => {
      const opcionKey = Array.isArray(item.opcion) ? item.opcion.join(",") : (item.opcion || "");
      const key = `${item.nombre}|${item.termino||""}|${opcionKey}|${(item.adiciones||[]).join(",")}`;
      const existe = prev.find(c => c._key === key);
      if (existe) return prev.map(c => c._key===key ? {...c,qty:c.qty+1} : c);
      return [...prev, {...item, _key:key, qty:1}];
    });
  };

  // ── removeOne: quitar una unidad del carrito ───────────────
  const removeOne = key => {
    setCart(prev => {
      const existe = prev.find(c => c._key===key);
      if (existe?.qty===1) return prev.filter(c=>c._key!==key);
      return prev.map(c => c._key===key ? {...c,qty:c.qty-1} : c);
    });
  };

  // ── Totales del carrito ────────────────────────────────────
  const totalItems  = cart.reduce((a,c) => a+c.qty, 0);
  const totalPrecio = cart.reduce((a,c) => a+c.precio*c.qty, 0);


  // ── handlePagar: confirmar y enviar el pedido ──────────────
  // Separa los items del carrito en dos grupos:
  //   - comidas → se envían a la API de cocina
  //   - bebidas → se envían a la API del bar
  // La mesa va por mesa_id (el id real que viene en la URL del QR).
  const handlePagar = async () => {
    if (enviandoPedido) return;

    if (!quejaMesa.trim()) {
      alert("Por favor ingresa el número de tu mesa antes de confirmar el pedido.");
      return;
    }

    setEnviandoPedido(true);

    // El destino real viene de la categoría en BD.
    const esBebida = c => c.destino ? c.destino === "bar" : BAR_CATS.includes(c.categoria);

    const comidas = cart.filter(c => !esBebida(c));
    const bebidas = cart.filter(c =>  esBebida(c));
    const errores = [];

    // 1. Enviar comidas a cocina
    if (comidas.length > 0) {
      try {
        const res = await fetch(`${API_URL}/pedidos-cocina`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurante_id: restauranteId,
            mesa_id: mesaId,
            t: qrToken,
            observacion: null,
            items: comidas.map(c => ({
              nombre:      c.nombre,
              cantidad:    c.qty,
              precio:      c.precio,
              categoria:   "comida",
              imagen:      c.imagen || c.img || null,
              observacion: [c.termino, ...(c.opcion || []), ...(c.adiciones || [])]
                .filter(Boolean).join(", ") || null,
            })),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errores.push(data.error || "No se pudo enviar la comida a cocina.");
        }
      } catch (err) {
        console.error("❌ Error enviando a cocina:", err);
        errores.push("No se pudo conectar con cocina.");
      }
    }

    // 2. Enviar bebidas al bar
    if (bebidas.length > 0) {
      try {
        const res = await fetch(`${API_URL}/bar/ordenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurante_id: restauranteId,
            mesa: quejaMesa,
            mesa_id: mesaId,
            t: qrToken,
              items: bebidas.map(b => ({
              nombre:    b.nombre,
              cantidad:  b.qty,
              precio:    b.precio,
              imagen:    b.imagen || b.img || null,
              adiciones: b.adiciones || [],
              opcion:    b.opcion || [],
            })),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          errores.push(data.msg || "No se pudo enviar la bebida al bar.");
        }
      } catch (err) {
        console.error("❌ Error enviando al bar:", err);
        errores.push("No se pudo conectar con el bar.");
      }
    }

    setEnviandoPedido(false);

    if (errores.length > 0) {
      alert(`Hubo un problema con tu pedido:\n\n${errores.join("\n")}\n\nRevisa el carrito e inténtalo de nuevo.`);
      return;
    }

    setPagado(true);
    setCart([]);
    fetchPedidosMesa();
  };

  // ── cerrarConfirmacionPagado: el cliente decide cuándo seguir pidiendo ──
  const cerrarConfirmacionPagado = () => {
    setPagado(false);
    setCartOpen(false);
  };

  // ── useEffect: cargar categorías para el modal de admin ───
  // 👈 Solo corre si es admin — un cliente normal ni siquiera
  // dispara este fetch (no puede abrir addModal de todos modos,
  // pero así evitamos la llamada de red innecesaria).
  useEffect(() => {
    if (addModal && esAdmin && categoriasBD.length === 0) {
    fetch(`${API_URL}/menu/${restauranteId}/categorias`)        .then(r => r.json())
        .then(setCategoriasBD)
        .catch(() => {});
    }
  }, [addModal, esAdmin, restauranteId]);

  // ── useEffect: cargar subcategorías cada vez que cambia la categoría
  // elegida en el modal de "Nuevo producto". Ya no depende de que la
  // categoría se llame "Bar" — funciona para cualquier categoría nueva.
  useEffect(() => {
    if (!addModal || !nuevoProducto.categoria_id) {
      setSubcategoriasBD([]);
      return;
    }
    setCargandoSubcats(true);
    fetch(`${API_URL}/menu/categorias/${nuevoProducto.categoria_id}/subcategorias`)
      .then(r => r.json())
      .then(data => setSubcategoriasBD(Array.isArray(data) ? data : []))
      .catch(() => setSubcategoriasBD([]))
      .finally(() => setCargandoSubcats(false));
  }, [addModal, nuevoProducto.categoria_id]);


   // ── handleCrearCategoria: crea una categoría desde el mini-formulario
  // inline del modal y la selecciona automáticamente en el producto.
  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.nombre.trim()) return;
    setGuardandoCategoria(true);
    try {
      const res = await fetch(`${API_URL}/menu/categorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ nombre: nuevaCategoria.nombre.trim(), imagen: nuevaCategoria.imagen || null, destino: nuevaCategoria.destino }),
      });
      const data = await res.json();
      if (res.ok) {
        const creada = { id: data.id, nombre: data.nombre, imagen: data.imagen, destino: data.destino };
        setCategoriasBD(prev => [...prev, creada]);
        setNuevoProducto(p => ({ ...p, categoria_id: String(creada.id), _catNombre: creada.nombre, subcategoria: "" }));
        setNuevaCategoria({ nombre: "", imagen: "", destino: "cocina" });
        setCreandoCategoria(false);
      }
    } catch (err) { console.error(err); }
    setGuardandoCategoria(false);
  };

  // ── handleCrearSubcategoria: igual que arriba, pero para subcategorías,
  // siempre ligada a la categoría que esté elegida en ese momento.
  const handleCrearSubcategoria = async () => {
    if (!nuevaSubcategoria.nombre.trim() || !nuevoProducto.categoria_id) return;
    setGuardandoSubcategoria(true);
    try {
      const res = await fetch(`${API_URL}/menu/subcategorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          nombre: nuevaSubcategoria.nombre.trim(),
          categoria_id: nuevoProducto.categoria_id,
          imagen: nuevaSubcategoria.imagen || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const creada = { id: data.id, nombre: data.nombre, imagen: data.imagen };
        setSubcategoriasBD(prev => [...prev, creada]);
        setNuevoProducto(p => ({ ...p, subcategoria: creada.nombre }));
        setNuevaSubcategoria({ nombre: "", imagen: "" });
        setCreandoSubcategoria(false);
      }
    } catch (err) { console.error(err); }
    setGuardandoSubcategoria(false);
  };

  // ── handleGuardarProducto: crear nuevo producto en la BD ──
  const handleGuardarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.categoria_id) return;
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ ...nuevoProducto, precio: Number(nuevoProducto.precio) }),
      });
      if (res.ok) {
        setGuardadoOk(true);
        setNuevoProducto({ nombre: "", descripcion: "", precio: "", categoria_id: "", _catNombre: "", subcategoria: "", imagen: "", adiciones: [] });
        setTimeout(() => {
          setGuardadoOk(false);
          setAddModal(false);
          fetch(`${API_URL}/menu/${restauranteId}`)
            .then(r => r.json())
            .then(data => {
              const organizado = {};
              data.forEach(prod => {
                const cat = prod.categoria || "Otros";
                if (!organizado[cat]) organizado[cat] = [];
                organizado[cat].push({
                  id: prod.id,
                  nombre: prod.nombre, img: resolveImg(prod.imagen),
                  imagen: prod.imagen,
                  disponible: prod.disponible === undefined ? true : !!prod.disponible,
                  descripcion: prod.descripcion, precio: prod.precio,
                  tiene_termino: prod.tiene_termino, opciones: prod.opciones || [],
                  adiciones: prod.adiciones || [], subcategoria: prod.subcategoria || null,
                  categoria: prod.categoria,
                  destino: prod.destino || "cocina",
                });
              });
              setMenuDB(organizado);
            });
        }, 1500);
      }
    } catch (err) { console.error(err); }
    setGuardando(false);
  };


  // ── handleEditarProducto: actualizar producto existente ───
  const handleEditarProducto = async () => {
    if (!editProducto?.id || !editProducto.nombre || !editProducto.precio) return;
    setEditando(true);
    try {
     const res = await fetch(`${API_URL}/menu/${editProducto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          nombre:      editProducto.nombre,
          descripcion: editProducto.descripcion,
          precio:      Number(editProducto.precio),
          imagen:      editProducto.imagen,
        }),
      });
      if (res.ok) {
        setEditOk(true);
        setTimeout(() => {
          setEditOk(false);
          setEditModal(false);
          fetch(`${API_URL}/menu/${restauranteId}`)
            .then(r => r.json())
            .then(data => {
              const organizado = {};
              data.forEach(prod => {
                const cat = prod.categoria || "Otros";
                if (!organizado[cat]) organizado[cat] = [];
                organizado[cat].push({
                  id: prod.id, nombre: prod.nombre,
                  img: resolveImg(prod.imagen),
                  imagen: prod.imagen,
                  disponible: prod.disponible === undefined ? true : !!prod.disponible,
                  descripcion: prod.descripcion, precio: prod.precio,
                  tiene_termino: prod.tiene_termino, opciones: prod.opciones || [],
                  adiciones: prod.adiciones || [], subcategoria: prod.subcategoria || null,
                  categoria: prod.categoria,
                });
              });
              setMenuDB(organizado);
            });
        }, 1500);
      }
    } catch (err) { console.error(err); }
    setEditando(false);
  };

  // ── handleToggleDisponible: activar/desactivar producto sin borrarlo ──
const handleToggleDisponible = async (item) => {
  if (!item.id) return;
  const nuevoValor = !item.disponible;
  try {
    const res = await fetch(`${API_URL}/menu/${item.id}/disponibilidad`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authService.getToken()}`,
      },
      body: JSON.stringify({ disponible: nuevoValor }),
    });
    if (res.ok) {
      // Actualiza el estado local sin tener que recargar todo el menú
      setMenuDB(prev => {
        const copia = { ...prev };
        for (const cat of Object.keys(copia)) {
          copia[cat] = copia[cat].map(p =>
            p.id === item.id ? { ...p, disponible: nuevoValor } : p
          );
        }
        return copia;
      });
    }
  } catch (err) {
    console.error("Error al cambiar disponibilidad:", err);
  }
};

  // ── toggleFav: agregar/quitar favorito ────────────────────
  const toggleFav = item =>
    setFavs(prev => prev.find(f=>f.nombre===item.nombre) ? prev.filter(f=>f.nombre!==item.nombre) : [...prev,item]);

  const isFav = nombre => favs.some(f=>f.nombre===nombre);


  // ── handleEnviarQueja: enviar mensaje al administrador ────
  const handleEnviarQueja = async () => {
    if (!quejaMsg.trim()) return;
    setQuejaLoading(true);
    try {
      await fetch(`${API_URL}/api/quejas`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({restaurante_id: restauranteId, mesa:quejaMesa, mensaje:quejaMsg}),
      });
      setQuejaSent(true); setQuejaMsg(""); setQuejaMesa("");
      setTimeout(() => setQuejaSent(false), 5000);
    } catch(err) { console.error(err); }
    setQuejaLoading(false);
  };


  // ── Lógica del buscador ───────────────────────────────────
  const allProductos = Object.values(dataFinal).flatMap(val =>
    typeof val==="object" && !Array.isArray(val) ? Object.values(val).flat() : Array.isArray(val) ? val : []
  );
  const productosFiltrados = searchText.trim()
    ? allProductos.filter(p => p.nombre?.toLowerCase().includes(searchText.toLowerCase()))
    : null;


  // ── renderCard: función para renderizar una tarjeta de producto
  const renderCard = (item, i) => (
  <div key={i} className={`food-card-wrapper ${item.disponible === false ? "food-card-wrapper--agotado" : ""}`}>
    <div className="card-media" onClick={() => item.disponible !== false && setSelectedItem(item)}>
      <FoodCard item={item} />

      {item.disponible === false && (
        <div className="agotado-badge">Agotado</div>
      )}

      <button className={`fav-btn ${isFav(item.nombre)?"active":""}`}
        onClick={e => { e.stopPropagation(); toggleFav(item); }}>
        {isFav(item.nombre) ? "❤️" : "🤍"}
      </button>

      {esAdmin && item.id && (
        <>
          <button className="edit-btn"
            onClick={e => { e.stopPropagation(); setEditProducto({ ...item, imagen: item.imagen || "" }); setEditModal(true); }}>
            ✏️
          </button>
          <button className={`toggle-disp-btn ${item.disponible === false ? "reactivar" : "desactivar"}`}
            onClick={e => { e.stopPropagation(); handleToggleDisponible(item); }}
            title={item.disponible === false ? "Reactivar producto" : "Marcar como agotado"}>
            {item.disponible === false ? "✅" : "🚫"}
          </button>
        </>
      )}
    </div>

    <div className="card-body" onClick={() => item.disponible !== false && setSelectedItem(item)}>
      <h3 className="card-title">{item.nombre}</h3>
      {item.descripcion && <p className="card-desc">{item.descripcion}</p>}

      <div className="card-footer">
        <span className="card-price">{fmtCOP(item.precio)}</span>
        {item.disponible !== false && (
          <button className="add-btn" onClick={e => { e.stopPropagation(); setSelectedItem(item); }}>+</button>
        )}
      </div>
    </div>
  </div>
);

  // ── renderSectionCards: pinta una cuadrícula de productos con paginación
  const renderSectionCards = (items, seccionKey) => {
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PAGE_SIZE));
    const page = Math.min(sectionPage[seccionKey] || 1, totalPages);
    const start = (page - 1) * ITEMS_PAGE_SIZE;
    const visibles = items.slice(start, start + ITEMS_PAGE_SIZE);

    const irPagina = p => {
      setSectionPage(prev => ({ ...prev, [seccionKey]: p }));
      document.getElementById(`sec-${seccionKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
      <>
        <div id={`sec-${seccionKey}`} className="cards">{visibles.map((item,i) => renderCard(item,i))}</div>
        {totalPages > 1 && (
          <div className="pagination-row">
            <button className="page-nav-btn" disabled={page===1} onClick={() => irPagina(page-1)} aria-label="Página anterior">‹</button>
            <span className="page-indicator">Página {page} de {totalPages}</span>
            <button className="page-nav-btn" disabled={page===totalPages} onClick={() => irPagina(page+1)} aria-label="Página siguiente">›</button>
          </div>
        )}
      </>
    );
  };


  // ── getBarItems: obtener productos de una subcategoría del bar
  const getBarItems = (cat, sub) => {
    const catData = dataFinal[cat];
    if (!catData) return [];
    if (Array.isArray(catData)) {
      return catData.filter(p =>
        p.subcategoria?.toLowerCase().trim() === sub.toLowerCase().trim()
      );
    }
    return catData[sub] || [];
  };

  // ── EmptyMenuState: pantalla que ve un restaurante nuevo sin
  // productos todavía. Para el admin, es la puerta de entrada
  // para empezar a construir su carta. Para un cliente, un aviso
  // de que el menú aún no está publicado.
  const EmptyMenuState = ({ titulo, mensaje }) => (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "60px 24px 40px", gap: "14px",
    }}>
      <div style={{ fontSize: "56px", lineHeight: 1 }}>🍽️</div>
      <h2 style={{ margin: 0, fontSize: "20px" }}>{titulo}</h2>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", maxWidth: "320px" }}>
        {mensaje}
      </p>
      {esAdmin && (
        <button className="modal-add-btn" style={{ marginTop: "10px", width: "auto", padding: "0 24px" }} onClick={() => setAddModal(true)}>
          ➕ Agregar mi primer producto
        </button>
      )}
    </div>
  );


  // ── RENDER ────────────────────────────────────────────────
  if (accesoInvalido) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", textAlign: "center", padding: "40px 24px", gap: "16px",
        background: "#0f0f0f", color: "#fff",
      }}>
        <div style={{ fontSize: "56px" }}>📷</div>
        <h2 style={{ margin: 0, fontSize: "20px" }}>Este enlace ya no es válido</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "14px", maxWidth: "320px" }}>
          Por seguridad, cada código QR corresponde solo a tu mesa. Escanéalo nuevamente para ver el menú y hacer tu pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="menu-container">

      {esAdmin && addModal && (
        <div className="product-modal-overlay" onClick={() => setAddModal(false)}>
          <div className="product-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-handle" />
            <button className="modal-close-btn" onClick={() => setAddModal(false)}>✕</button>
            <div className="product-modal-body" style={{ paddingTop: "20px" }}>
              <h2 className="product-modal-title" style={{ marginBottom: "20px" }}>➕ Nuevo producto</h2>

              <div className="modal-section">
                <p className="modal-section-title">Nombre</p>
                <input className="queja-mesa-input" placeholder="Ej: Arroz con pollo"
                  value={nuevoProducto.nombre}
                  onChange={e => setNuevoProducto(p => ({ ...p, nombre: e.target.value }))} />
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Descripción</p>
                <textarea className="queja-input" style={{ minHeight: "70px" }} placeholder="Descripción del plato..."
                  value={nuevoProducto.descripcion}
                  onChange={e => setNuevoProducto(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Precio (COP)</p>
                <input className="queja-mesa-input" type="number" placeholder="Ej: 25000"
                  value={nuevoProducto.precio}
                  onChange={e => setNuevoProducto(p => ({ ...p, precio: e.target.value }))} />
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Categoría</p>

                <div className="picker-grid">
                  {categoriasBD.map(c => (
                    <button type="button" key={c.id}
                      className={`picker-chip ${String(nuevoProducto.categoria_id) === String(c.id) ? "selected" : ""}`}
                      onClick={() => setNuevoProducto(p => ({ ...p, categoria_id: String(c.id), _catNombre: c.nombre, subcategoria: "" }))}>
                      {c.imagen
                        ? <img src={c.imagen} alt="" className="picker-chip-thumb" />
                        : <span>{catIconos[c.nombre] || "🍴"}</span>}
                      {c.nombre}
                    </button>
                  ))}
                  <button type="button" className="picker-chip picker-chip--add"
                    onClick={() => setCreandoCategoria(v => !v)}>
                    ➕ Crear categoría nueva
                  </button>
                </div>

                {categoriasBD.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "6px" }}>
                    Cargando categorías...
                  </p>
                )}

                {creandoCategoria && (
                  <div className="inline-create-panel">
                    <p className="inline-create-panel-title">Nueva categoría</p>
                    <input className="queja-mesa-input" placeholder="Ej: Postres"
                      value={nuevaCategoria.nombre}
                      onChange={e => setNuevaCategoria(c => ({ ...c, nombre: e.target.value }))} />
                    <ImageUploadField
                      value={nuevaCategoria.imagen}
                      onChange={url => setNuevaCategoria(c => ({ ...c, imagen: url }))} />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button"
                        className={`picker-chip ${nuevaCategoria.destino === "cocina" ? "selected" : ""}`}
                        onClick={() => setNuevaCategoria(c => ({ ...c, destino: "cocina" }))}>
                        🍳 Va a cocina
                      </button>
                      <button type="button"
                        className={`picker-chip ${nuevaCategoria.destino === "bar" ? "selected" : ""}`}
                        onClick={() => setNuevaCategoria(c => ({ ...c, destino: "bar" }))}>
                        🍹 Va a barra
                      </button>
                    </div>
                    <div className="inline-create-actions">
                      <button type="button" className="inline-create-cancel-btn"
                        onClick={() => { setCreandoCategoria(false); setNuevaCategoria({ nombre: "", imagen: "" }); }}>
                        Cancelar
                      </button>
                      <button type="button" className="inline-create-save-btn"
                        onClick={handleCrearCategoria}
                        disabled={guardandoCategoria || !nuevaCategoria.nombre.trim()}>
                        {guardandoCategoria ? "Creando..." : "Crear y seleccionar"}
                      </button>
                    </div>
                  </div>
                )}

                {nuevoProducto.categoria_id && (
                  <div style={{ marginTop: "16px" }}>
                    <p className="modal-section-title" style={{ marginBottom: "10px" }}>Subcategoría (opcional)</p>

                    <div className="picker-grid">
                      {subcategoriasBD.map(s => (
                        <button type="button" key={s.id}
                          className={`picker-chip ${nuevoProducto.subcategoria === s.nombre ? "selected" : ""}`}
                          onClick={() => setNuevoProducto(p => ({ ...p, subcategoria: p.subcategoria === s.nombre ? "" : s.nombre }))}>
                          {s.imagen
                            ? <img src={s.imagen} alt="" className="picker-chip-thumb" />
                            : <span>{BAR_ICONS[s.nombre] || "🏷️"}</span>}
                          {s.nombre}
                        </button>
                      ))}
                      <button type="button" className="picker-chip picker-chip--add"
                        onClick={() => setCreandoSubcategoria(v => !v)}>
                        ➕ Crear subcategoría nueva
                      </button>
                    </div>

                    {cargandoSubcats && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "6px" }}>
                        Cargando subcategorías...
                      </p>
                    )}

                    {creandoSubcategoria && (
                      <div className="inline-create-panel">
                        <p className="inline-create-panel-title">Nueva subcategoría</p>
                        <input className="queja-mesa-input" placeholder="Ej: Helados"
                          value={nuevaSubcategoria.nombre}
                          onChange={e => setNuevaSubcategoria(s => ({ ...s, nombre: e.target.value }))} />
                        <ImageUploadField
                          value={nuevaSubcategoria.imagen}
                          onChange={url => setNuevaSubcategoria(s => ({ ...s, imagen: url }))} />
                        <div className="inline-create-actions">
                          <button type="button" className="inline-create-cancel-btn"
                            onClick={() => { setCreandoSubcategoria(false); setNuevaSubcategoria({ nombre: "", imagen: "" }); }}>
                            Cancelar
                          </button>
                          <button type="button" className="inline-create-save-btn"
                            onClick={handleCrearSubcategoria}
                            disabled={guardandoSubcategoria || !nuevaSubcategoria.nombre.trim()}>
                            {guardandoSubcategoria ? "Creando..." : "Crear y seleccionar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

                <div className="modal-section">
                <p className="modal-section-title">Imagen</p>
                <ImageUploadField
                  value={nuevoProducto.imagen}
                  onChange={url => setNuevoProducto(p => ({ ...p, imagen: url }))}
                />
                </div>

              <div className="modal-section">
                <p className="modal-section-title">Adiciones</p>
                {nuevoProducto.adiciones.map((ad, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <span style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                      {ad.nombre} — {fmtCOP(ad.precio)}
                    </span>
                    <button onClick={() => setNuevoProducto(p => ({ ...p, adiciones: p.adiciones.filter((_, j) => j !== i) }))}
                      style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#ef4444", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input className="queja-mesa-input" placeholder="Nombre adición"
                    value={nuevaAdicion.nombre}
                    onChange={e => setNuevaAdicion(a => ({ ...a, nombre: e.target.value }))}
                    style={{ flex: 2 }} />
                  <input className="queja-mesa-input" type="number" placeholder="Precio"
                    value={nuevaAdicion.precio}
                    onChange={e => setNuevaAdicion(a => ({ ...a, precio: e.target.value }))}
                    style={{ flex: 1 }} />
                  <button onClick={() => {
                    if (!nuevaAdicion.nombre) return;
                    setNuevoProducto(p => ({ ...p, adiciones: [...p.adiciones, { nombre: nuevaAdicion.nombre, precio: Number(nuevaAdicion.precio) || 0 }] }));
                    setNuevaAdicion({ nombre: "", precio: "" });
                  }} style={{ background: "#f59e0b", border: "none", color: "#1a1206", borderRadius: "10px", padding: "0 14px", cursor: "pointer", fontSize: "18px" }}>
                    +
                  </button>
                </div>
              </div>

              {guardadoOk && (
                <div className="queja-success">✅ ¡Producto guardado correctamente!</div>
              )}

              <button className="modal-add-btn"
                onClick={handleGuardarProducto}
                disabled={guardando || !nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.categoria_id}>
                {guardando ? "Guardando..." : "💾 Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {esAdmin && editModal && editProducto && (
        <div className="product-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="product-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-handle" />
            <button className="modal-close-btn" onClick={() => setEditModal(false)}>✕</button>
            <div className="product-modal-body" style={{ paddingTop: "20px" }}>
              <h2 className="product-modal-title" style={{ marginBottom: "20px" }}>✏️ Editar producto</h2>

              <div className="modal-section">
                <p className="modal-section-title">Nombre</p>
                <input className="queja-mesa-input" value={editProducto.nombre}
                  onChange={e => setEditProducto(p => ({ ...p, nombre: e.target.value }))} />
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Descripción</p>
                <textarea className="queja-input" style={{ minHeight: "70px" }} value={editProducto.descripcion || ""}
                  onChange={e => setEditProducto(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Precio (COP)</p>
                <input className="queja-mesa-input" type="number" value={editProducto.precio}
                  onChange={e => setEditProducto(p => ({ ...p, precio: e.target.value }))} />
              </div>

              <div className="modal-section">
              <p className="modal-section-title">Imagen</p>
              <ImageUploadField
                value={editProducto.imagen}
                onChange={url => setEditProducto(p => ({ ...p, imagen: url }))}
              />
            </div>

              {editOk && <div className="queja-success">✅ ¡Producto actualizado!</div>}

              <button className="modal-add-btn" onClick={handleEditarProducto}
                disabled={editando || !editProducto.nombre || !editProducto.precio}>
                {editando ? "Guardando..." : "💾 Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={addToCart} />
      )}

      <div className={`sidebar ${menuOpen?"open":""}`}>
        <div className="sidebar-top">
          <span className="sidebar-title">MesaSmart</span>
          <button className="sidebar-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <p className="sidebar-item" onClick={() => { setMenuOpen(false); setActiveTab("home"); setCategoria(null); setSubCategoria(null); }}>
            <span className="sidebar-item-icon sidebar-item-icon--home">🏠</span> Inicio
          </p>
          <p className="sidebar-item" onClick={() => { setMenuOpen(false); setActiveTab("menu"); setCategoria(null); setSubCategoria(null); }}>
            <span className="sidebar-item-icon sidebar-item-icon--menu">📋</span> Menú
          </p>
          <p className="sidebar-item" onClick={() => { setMenuOpen(false); setCartOpen(true); }}>
            <span className="sidebar-item-icon sidebar-item-icon--cart">🛒</span> Órdenes
          </p>
          <p className="sidebar-item" onClick={() => { setMenuOpen(false); setActiveTab("mesas"); }}>
            <span className="sidebar-item-icon sidebar-item-icon--mesas">🍽️</span> Mesas
          </p>
          <p className="sidebar-item" onClick={() => { setMenuOpen(false); setActiveTab("reportes"); }}>
            <span className="sidebar-item-icon sidebar-item-icon--reportes">📊</span> Reportes
          </p>

          <hr className="sidebar-hr" />

          <p className="sidebar-item sidebar-logout" onClick={() => { setMenuOpen(false); navigate("/"); }}>
            <span className="sidebar-item-icon sidebar-item-icon--logout">🚪</span> Salir del menú
          </p>
        </nav>
      </div>
      {menuOpen && <div className="overlay-bg" onClick={() => setMenuOpen(false)}/>}

      {cartOpen && <div className="overlay-bg" onClick={() => setCartOpen(false)}/>}
      <div className={`cart-panel ${cartOpen?"open":""}`}>
        <div className="cart-panel-header">
          <h2>Tu orden 🛒</h2>
          <button className="sidebar-close-btn" onClick={() => setCartOpen(false)}>✕</button>
        </div>

         {pagado ? (
          <div className="cart-paid">
            <div className="cart-paid-icon">✅</div>
            <h3>¡Pedido enviado!</h3>
            <p>
              Un mesero va a confirmar tu pedido en un momento. Cuando termines de comer, dirígete a caja a pagar 🎉<br/>
              {quejaMesa && <strong>Tu mesa es la {quejaMesa}</strong>}
            </p>
            <button className="modal-add-btn" style={{ marginTop: "18px", width: "auto", padding: "0 28px" }}
              onClick={cerrarConfirmacionPagado}>
              Seguir pidiendo
            </button>
          </div>
        ) : (
          <>
             {(pedidosMesa.length > 0 || pedidosBarMesa.length > 0) && (
              <div style={{ padding: "14px 22px 0" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  🍽️ Ya pedido en tu mesa
                </p>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "6px 14px", marginBottom: "6px" }}>
                  {[...pedidosMesa, ...pedidosBarMesa].map((p, i, arr) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                        <span style={{
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                          fontSize: "13px",
                          fontWeight: 800,
                          borderRadius: "8px",
                          padding: "3px 9px",
                          flexShrink: 0,
                        }}>
                          {p.cantidad}x
                        </span>
                        <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                          {p.nombre}
                        </span>
                      </div>
                      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 600, flexShrink: 0 }}>
                        {fmtCOP(p.precio * p.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cart.length===0 ? (
              <p className="cart-empty">Aún no has agregado nada nuevo 🍽️</p>
            ) : (
          <>
               <div style={{ padding: "14px 22px 0" }}>
              <input
                type="text"
                placeholder="¿Cuál es tu mesa? (ej: Mesa 3)"
                value={quejaMesa}
                onChange={e => setQuejaMesa(e.target.value)}
                readOnly={!!mesaId}
                disabled={!!mesaId}
                style={{
                  width: "100%",
                  background: mesaId ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: mesaId ? "rgba(255,255,255,0.6)" : "#fff",
                  fontSize: "14px",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  outline: "none",
                  cursor: mesaId ? "not-allowed" : "text",
                }}
              />
              {mesaId && (
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px", paddingLeft: "2px" }}>
                  🔒 Mesa asignada automáticamente por tu código QR
                </p>
              )}
            </div>

            <ul className="cart-list">
              {cart.map((c,i) => (
                <li key={i} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{c.nombre}</span>
                    {(c.termino || c.opcion?.length>0 || c.adiciones?.length>0) && (
                      <span className="cart-item-meta">
                        {[c.termino, ...(c.opcion||[]), ...(c.adiciones||[])].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    <span className="cart-item-price">{fmtCOP(c.precio)}</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => removeOne(c._key)}>−</button>
                    <span>{c.qty}</span>
                    <button onClick={() => addToCart(c)}>+</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-total">
              <span>Total</span>
              <span className="cart-total-price">{fmtCOP(totalPrecio)}</span>
            </div>

            <button className="cart-pay-btn" onClick={handlePagar} disabled={enviandoPedido}>
              {enviandoPedido ? "Enviando..." : `Pagar ${fmtCOP(totalPrecio)}`}
            </button>
              </>
            )}
          </>
        )}
      </div>

      <div className="top-bar">
        <span className="menu-icon" onClick={() => setMenuOpen(true)}>☰</span>
        <h1>Mesa<span>Smart</span></h1>
        <button className="cart-icon-btn" onClick={() => setCartOpen(true)}>
          🛒 {totalItems>0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>

      {totalItems > 0 && !cartOpen && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <span className="cart-fab-icon">🛒</span>
          <span className="cart-fab-text">Ver pedido</span>
          <span className="cart-fab-badge">{totalItems}</span>
          <span className="cart-fab-total">{fmtCOP(totalPrecio)}</span>
        </button>
      )}

      {!menuVacio && (
        <div className="search-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Buscar platos..." value={searchText} onChange={e => setSearchText(e.target.value)}/>
          </div>
        </div>
      )}

      {searchText.trim() && (
        <>
          <p className="section-title">🔍 Resultados</p>
          <div className="cards">
            {productosFiltrados.length>0
              ? productosFiltrados.map((item,i) => renderCard(item,i))
              : <p style={{color:"rgba(255,255,255,0.4)",padding:"0 0 20px",gridColumn:"1/-1"}}>No se encontraron platos.</p>
            }
          </div>
        </>
      )}

      {activeTab==="home" && !searchText.trim() && (
        menuVacio ? (
          <EmptyMenuState
            titulo={esAdmin ? "Aún no has agregado productos" : "Este menú todavía no tiene productos"}
            mensaje={esAdmin
              ? "Empieza a construir tu carta agregando tu primer plato, bebida o categoría."
              : "Vuelve pronto, el restaurante está preparando su menú."}
          />
        ) : (
          <>
            <div className="section-header">
              <h2>Categorías</h2>
              <div className="section-header-actions">
                {esAdmin && (
                  <button className="add-cat-btn" onClick={() => setAddModal(true)} aria-label="Agregar producto">+</button>
                )}
                <button type="button" className="show-all" onClick={() => setActiveTab("menu")}>Ver todo ›</button>
              </div>
            </div>

            <div className="categories">
              {Object.keys(dataFinal).map(cat => {
                const bgImg = getCatImage(cat);
                return (
                  <div key={cat} className={`category-card ${categoria===cat?"active":""} ${!bgImg?"category-card--noimg":""}`}
                    style={bgImg ? { backgroundImage: `url(${bgImg})` } : { background: catGradientes[cat] || catGradienteDefault }}
                    onClick={() => { setCategoria(cat); setSubCategoria(null); setActiveTab("menu"); }}>
                    <span className="cat-icon-circle" style={{ background: catGradientes[cat] || catGradienteDefault }}>
                      <span className="cat-icon">{catIconos[cat]||"🍴"}</span>
                    </span>
                    <span className="cat-label">{cat}</span>
                  </div>
                );
              })}
            </div>

            {destacados.length > 0 && (
              <>
                <p className="section-title">⭐ Recomendados</p>
                <div className="cards">{destacados.map((item,i) => renderCard(item,i))}</div>
              </>
            )}

            {favs.length>0 && (
              <>
                <p className="section-title">❤️ Tus favoritos</p>
                <div className="cards">{favs.map((item,i) => renderCard(item,i))}</div>
              </>
            )}
          </>
        )
      )}

      {activeTab==="menu" && !searchText.trim() && (
        menuVacio ? (
          <EmptyMenuState
            titulo={esAdmin ? "Tu carta está vacía" : "Este restaurante aún no publica su menú"}
            mensaje={esAdmin
              ? "Crea categorías y agrega tus primeros productos para que tus clientes puedan verlos y pedir."
              : "Vuelve más tarde, pronto estará disponible."}
          />
        ) : (
          <>
            <div className="section-header">
              <h2>Categorías</h2>
              <div className="section-header-actions">
                {esAdmin && (
                  <button className="add-cat-btn" onClick={() => setAddModal(true)} aria-label="Agregar producto">+</button>
                )}
                <button type="button" className="show-all" onClick={() => { setCategoria(null); setSubCategoria(null); }}>Ver todo ›</button>
              </div>
            </div>

            <div className="categories">
              {Object.keys(dataFinal).map(cat => {
                const bgImg = getCatImage(cat);
                return (
                  <div key={cat} className={`category-card ${categoria===cat?"active":""} ${!bgImg?"category-card--noimg":""}`}
                    style={bgImg ? { backgroundImage: `url(${bgImg})` } : { background: catGradientes[cat] || catGradienteDefault }}
                    onClick={() => { setCategoria(cat); setSubCategoria(null); }}>
                    <span className="cat-icon-circle" style={{ background: catGradientes[cat] || catGradienteDefault }}>
                      <span className="cat-icon">{catIconos[cat]||"🍴"}</span>
                    </span>
                    <span className="cat-label">{cat}</span>
                  </div>
                );
              })}
            </div>

            {BAR_CATS.includes(categoria) && (
              <div className="categories categories--sub">
                {BAR_SUBS.map(sub => (
                  <div key={sub} className={`category-card category-card--sub ${subCategoria===sub?"active":""}`}
                    onClick={() => setSubCategoria(sub)}>
                    <span className="cat-icon-circle" style={{ background: catGradientes["Bar"] }}>
                      <span className="cat-icon">{BAR_ICONS[sub]}</span>
                    </span>
                    <span className="cat-label">{sub}</span>
                  </div>
                ))}
              </div>
            )}

                        <div ref={productosRef}>
              {categoria && !BAR_CATS.includes(categoria) && (
                <>
                  <p className="section-title">{catIconos[categoria]} {categoria}</p>
                  {renderSectionCards(dataFinal[categoria]||[], `cat-${categoria}`)}
                </>
              )}

              {BAR_CATS.includes(categoria) && !subCategoria && BAR_SUBS.map(sub => (
                getBarItems(categoria, sub).length > 0 && (
                  <div key={sub}>
                    <p className="section-title">{BAR_ICONS[sub]} {sub}</p>
                    {renderSectionCards(getBarItems(categoria, sub), `bar-${sub}`)}
                  </div>
                )
              ))}

              {BAR_CATS.includes(categoria) && subCategoria && (
                <>
                  <p className="section-title">{BAR_ICONS[subCategoria]} {subCategoria}</p>
                  {getBarItems(categoria, subCategoria).length > 0
                    ? renderSectionCards(getBarItems(categoria, subCategoria), `bar-${subCategoria}`)
                    : <p style={{color:"rgba(255,255,255,0.35)",padding:"0 0 20px",fontSize:"14px"}}>
                        No hay productos en esta subcategoría aún.
                      </p>
                  }
                </>
              )}
            </div>

            {!categoria && (() => {
              const todasLasCats  = Object.keys(dataFinal).filter(k => !BAR_CATS.includes(k));
              const totalCatPages = Math.max(1, Math.ceil(todasLasCats.length / CATS_PAGE_SIZE));
              const catPageActual = Math.min(catsPage, totalCatPages);
              const catsAMostrar  = todasLasCats.slice((catPageActual-1)*CATS_PAGE_SIZE, catPageActual*CATS_PAGE_SIZE);

              const irPaginaCats = p => {
                setCatsPage(p);
                document.getElementById("todas-categorias")?.scrollIntoView({ behavior: "smooth", block: "start" });
              };

              return (
                <div id="todas-categorias">
                  {catsAMostrar.map(cat => (
                    <div key={cat}>
                      <p className="section-title">{catIconos[cat]||"🍴"} {cat}</p>
                      {renderSectionCards(dataFinal[cat]||[], `all-${cat}`)}
                    </div>
                  ))}
                  {totalCatPages > 1 && (
                    <div className="pagination-row pagination-row--cats">
                      <button className="page-nav-btn" disabled={catPageActual===1} onClick={() => irPaginaCats(catPageActual-1)} aria-label="Categorías anteriores">‹</button>
                      <span className="page-indicator">Categorías — Página {catPageActual} de {totalCatPages}</span>
                      <button className="page-nav-btn" disabled={catPageActual===totalCatPages} onClick={() => irPaginaCats(catPageActual+1)} aria-label="Más categorías">›</button>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )
      )}

      {activeTab==="favs" && (
        <div className="favs-container">
          <p className="section-title">❤️ Mis favoritos</p>
          {favs.length===0
            ? <p className="favs-empty">Aún no tienes favoritos.<br/>Toca el 🤍 en cualquier plato.</p>
            : <div className="cards">{favs.map((item,i) => renderCard(item,i))}</div>
          }
        </div>
      )}

      {activeTab==="notif" && (
        <div className="avisos-container">
          <p className="section-title">🔔 Avisos y sugerencias</p>
          <div className="queja-form">
            <h3>¿Tienes alguna queja o sugerencia?</h3>
            <p>Tu mensaje llega directamente al administrador del restaurante.</p>
            <input className="queja-mesa-input" type="text" placeholder="Número de mesa (opcional)"
              value={quejaMesa} onChange={e => setQuejaMesa(e.target.value)}
              readOnly={!!mesaId} disabled={!!mesaId}
              style={mesaId ? { opacity: 0.6, cursor: "not-allowed" } : undefined} />
            <textarea className="queja-input" placeholder="Escribe aquí tu queja, sugerencia o comentario..."
              value={quejaMsg} onChange={e => setQuejaMsg(e.target.value)}/>
            <button className="queja-send-btn" onClick={handleEnviarQueja} disabled={quejaLoading||!quejaMsg.trim()}>
              {quejaLoading ? "Enviando..." : "📨 Enviar mensaje"}
            </button>
            {quejaSent && <div className="queja-success">✅ ¡Mensaje enviado! Gracias por tu retroalimentación.</div>}
          </div>
        </div>
      )}

      {activeTab==="mesas" && (
        <div className="avisos-container">
          <p className="section-title">🍽️ Mesas</p>
          <p className="favs-empty">Próximamente podrás ver y gestionar el estado de tus mesas desde aquí.</p>
        </div>
      )}

      {activeTab==="reportes" && (
        <div className="avisos-container">
          <p className="section-title">📊 Reportes</p>
          <p className="favs-empty">Próximamente encontrarás aquí tus reportes de ventas y desempeño.</p>
        </div>
      )}

      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab==="home"?"active":""}`}
          onClick={() => { setActiveTab("home"); setCategoria(null); setSubCategoria(null); setSearchText(""); }}>
          <span className="nav-icon">🏠</span><span>Inicio</span>
        </button>
        <button className={`nav-btn ${activeTab==="menu"?"active":""}`}
          onClick={() => { setActiveTab("menu"); setSearchText(""); }}>
          <span className="nav-icon">📋</span><span>Menú</span>
        </button>
        <button className={`nav-btn ${activeTab==="favs"?"active":""}`} onClick={() => setActiveTab("favs")}>
          <span className="nav-icon">❤️</span><span>Favoritos</span>
          {favs.length>0 && <span style={{background:"#dc2050",color:"#fff",borderRadius:"50%",fontSize:"9px",fontWeight:"800",padding:"1px 5px"}}>{favs.length}</span>}
        </button>
        <button className={`nav-btn ${activeTab==="notif"?"active":""}`} onClick={() => setActiveTab("notif")}>
          <span className="nav-icon">🔔</span><span>Avisos</span>
        </button>
      </nav>
    </div>
  );
};

export default Menu;