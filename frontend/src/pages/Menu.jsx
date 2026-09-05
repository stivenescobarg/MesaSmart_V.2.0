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
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Menu.css";
import FoodCard from "../components/FoodCard";
import { imagenes } from "../data/imagenes";
import { API_URL } from "../services/config";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

// ── Íconos por categoría ─────────────────────────────────────
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
const fmtCOP    = n => `$${Number(n).toLocaleString("es-CO")}`;

// ── Restaurante "demo" ───────────────────────────────────────
// Único restaurante que, mientras no tenga productos propios en
// la BD, cae al menú estático de ejemplo (comportamiento legacy).
// Cualquier otro restaurante nuevo arranca con el menú realmente
// vacío para que vea SU plantilla, no la comida de otro tenant.
const RESTAURANTE_DEMO_ID = "1";


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

  // ── Estados del modal "Editar producto" (admin) ───────────
  const [editModal,    setEditModal]    = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [editando,     setEditando]     = useState(false);
  const [editOk,       setEditOk]       = useState(false);


  // ── useEffect: cargar menú desde la API ───────────────────
  useEffect(() => {
    if (!restauranteId) return;
    fetch(`${API_URL}/menu/${restauranteId}`)
      .then(res => res.json())
      .then(data => {
        const organizado = {};
        data.forEach(prod => {
          const cat = prod.categoria || "Otros";
          if (!organizado[cat]) organizado[cat] = [];
          organizado[cat].push({
            nombre:        prod.nombre,
            img:           imagenes[prod.imagen] || null,
            descripcion:   prod.descripcion,
            precio:        prod.precio,
            tiene_termino: prod.tiene_termino,
            opciones:      prod.opciones  || [],
            adiciones:     prod.adiciones || [],
            subcategoria:  prod.subcategoria || null,
            categoria:     prod.categoria,
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


  // ── menuData: datos estáticos de respaldo (SOLO restaurante demo) ──
  const menuData = {
    "Platos fuertes": [
      {
        nombre:"Hamburguesa Especial", img:imagenes.hamburguesa, categoria:"Platos fuertes",
        descripcion:"Carne de res a la parrilla, pan artesanal, queso, lechuga y tomate.",
        precio:28000, tiene_termino:false,
        opciones: [{nombre:"Papas a la francesa",precio:0},{nombre:"Papas al vapor",precio:0},{nombre:"Ensalada verde",precio:0}],
        adiciones:[{nombre:"Queso extra",precio:3000},{nombre:"Tocineta",precio:5000},{nombre:"Aguacate extra",precio:4000}],
      },
      {
        nombre:"Alitas BBQ", img:imagenes.alitas, categoria:"Platos fuertes",
        descripcion:"Alitas crocantes bañadas en salsa BBQ ahumada. Con dip de queso azul.",
        precio:32000, tiene_termino:false,
        opciones: [{nombre:"Papas a la francesa",precio:0},{nombre:"Papas al vapor",precio:0}],
        adiciones:[{nombre:"Salsa extra",precio:2000},{nombre:"Queso fundido",precio:4000}],
      },
      {
        nombre:"Pechuga a la Plancha", img:imagenes.pechuga, categoria:"Platos fuertes",
        descripcion:"Pechuga jugosa marinada a la plancha con especias, servida con guarnición.",
        precio:26000, tiene_termino:false,
        opciones: [{nombre:"Arroz con ensalada",precio:0},{nombre:"Papas al vapor",precio:0}],
        adiciones:[{nombre:"Salsa especial",precio:2000},{nombre:"Aguacate extra",precio:4000}],
      },
      {
        nombre:"Sudado de Pollo", img:imagenes.sudado, categoria:"Platos fuertes",
        descripcion:"Pollo tierno en salsa criolla con papa, yuca y arroz blanco.",
        precio:24000, tiene_termino:false,
        opciones: [{nombre:"Con arroz",precio:0},{nombre:"Con yuca",precio:0}],
        adiciones:[{nombre:"Chicharrón",precio:5000},{nombre:"Aguacate",precio:3000}],
      },
      {
        nombre:"Chicharrón", img:imagenes.chicharron, categoria:"Platos fuertes",
        descripcion:"Chicharrón crocante de cerdo, acompañado con arepa y limón.",
        precio:22000, tiene_termino:false,
        opciones: [{nombre:"Con arepa",precio:0},{nombre:"Con papa",precio:0}],
        adiciones:[{nombre:"Ají picante",precio:1000},{nombre:"Limón extra",precio:500}],
      },
    ],
    "Entradas": [
      {
        nombre:"Patacones con Guacamole", img:imagenes.patacon, categoria:"Entradas",
        descripcion:"Patacones crocantes con guacamole fresco, tomate y cilantro.",
        precio:18000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Queso rallado",precio:2000}],
      },
      {
        nombre:"Crispetas", img:imagenes.crispetas, categoria:"Entradas",
        descripcion:"Crispetas de maíz dulces o saladas, perfectas para compartir.",
        precio:8000, tiene_termino:false,
        opciones:[{nombre:"Dulces",precio:0},{nombre:"Saladas",precio:0}],
        adiciones:[{nombre:"Mantequilla extra",precio:1000}],
      },
      {
        nombre:"Deditos de Queso", img:imagenes.deditos, categoria:"Entradas",
        descripcion:"Deditos crocantes rellenos de queso fundido. Imposible comer solo uno.",
        precio:16000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Salsa BBQ",precio:1500},{nombre:"Salsa rosada",precio:1500}],
      },
      {
        nombre:"Empanadas", img:imagenes.empanadas, categoria:"Entradas",
        descripcion:"Empanadas de pipián, carne o pollo. Crujientes por fuera, jugosas por dentro.",
        precio:12000, tiene_termino:false,
        opciones:[{nombre:"De carne",precio:0},{nombre:"De pollo",precio:0},{nombre:"De pipián",precio:0}],
        adiciones:[{nombre:"Ají extra",precio:500}],
      },
      {
        nombre:"Carpaccio", img:imagenes.carpaccio, categoria:"Entradas",
        descripcion:"Finas láminas de res con rúcula, alcaparras, parmesano y aceite de oliva.",
        precio:28000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Extra parmesano",precio:3000}],
      },
    ],
    "Platos típicos": [
      {
        nombre:"Bandeja Paisa", img:imagenes.bandeja, categoria:"Platos típicos",
        descripcion:"Frijoles, arroz, carne molida, chicharrón, chorizo, huevo frito, arepa y aguacate.",
        precio:36000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Mazorca adicional",precio:5000},{nombre:"Chorizo extra",precio:6000}],
      },
      {
        nombre:"Mondongo", img:imagenes.mondongo, categoria:"Platos típicos",
        descripcion:"Sopa tradicional de mondongo con papa, zanahoria, maíz y hierbas aromáticas.",
        precio:28000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Arepa extra",precio:2000},{nombre:"Limón extra",precio:500}],
      },
      {
        nombre:"Sancocho", img:imagenes.sancocho, categoria:"Platos típicos",
        descripcion:"Sancocho trifásico con pollo, res y cerdo, papa, yuca, plátano y mazorca.",
        precio:32000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Presa extra",precio:6000},{nombre:"Arroz extra",precio:2000}],
      },
      {
        nombre:"Frijoles Antioqueños", img:imagenes.frijoles, categoria:"Platos típicos",
        descripcion:"Frijoles cargamanto con hogao, chicharrón y todo el sabor de Antioquia.",
        precio:22000, tiene_termino:false,
        opciones:[{nombre:"Con arroz",precio:0},{nombre:"Solo frijoles",precio:0}],
        adiciones:[{nombre:"Chicharrón extra",precio:5000},{nombre:"Aguacate",precio:3000}],
      },
      {
        nombre:"Cazuela de Mariscos", img:imagenes.cazuela, categoria:"Platos típicos",
        descripcion:"Cazuela cremosa con camarones, calamares y mejillones en salsa de coco.",
        precio:42000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Pan tostado",precio:3000},{nombre:"Arroz de coco",precio:4000}],
      },
    ],
    "Pastas": [
      {
        nombre:"Carbonara Clásica", img:imagenes.carbonara, categoria:"Pastas",
        descripcion:"Spaghetti con salsa de huevo, queso pecorino, guanciale crujiente y pimienta negra.",
        precio:30000, tiene_termino:false,
        opciones:[{nombre:"Spaghetti",precio:0},{nombre:"Fettuccine",precio:0},{nombre:"Penne",precio:0}],
        adiciones:[{nombre:"Extra queso parmesano",precio:3000},{nombre:"Tocineta extra",precio:4000}],
      },
      {
        nombre:"Pasta al Pesto", img:imagenes.pesto, categoria:"Pastas",
        descripcion:"Linguine al dente con pesto de albahaca fresca, piñones tostados y parmesano.",
        precio:27000, tiene_termino:false,
        opciones:[{nombre:"Linguine",precio:0},{nombre:"Fettuccine",precio:0}],
        adiciones:[{nombre:"Pollo grillado",precio:8000},{nombre:"Camarones",precio:12000}],
      },
      {
        nombre:"Lasaña de Carne", img:imagenes.carbonara, categoria:"Pastas",
        descripcion:"Lasaña tradicional con carne de res, salsa bechamel y queso gratinado.",
        precio:32000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Extra queso",precio:3000},{nombre:"Salsa extra",precio:2000}],
      },
    ],
    "Cortes": [
      {
        nombre:"Punta de Anca", img:imagenes.ribeye, categoria:"Cortes",
        descripcion:"Corte de res premium, jugoso y tierno. Cocinado a la parrilla de carbón.",
        precio:58000, tiene_termino:true,
        opciones:[{nombre:"Papas al romero",precio:0},{nombre:"Puré de papa",precio:0},{nombre:"Ensalada mixta",precio:0}],
        adiciones:[{nombre:"Salsa chimichurri",precio:4000},{nombre:"Salsa de pimienta",precio:4000}],
      },
      {
        nombre:"Solomito", img:imagenes.strip, categoria:"Cortes",
        descripcion:"Solomito de res tierno con mantequilla de hierbas y sal marina gruesa.",
        precio:62000, tiene_termino:true,
        opciones:[{nombre:"Papas al romero",precio:0},{nombre:"Arroz integral",precio:0}],
        adiciones:[{nombre:"Hongos salteados",precio:6000},{nombre:"Cebolla caramelizada",precio:3000}],
      },
      {
        nombre:"Ribeye 300g", img:imagenes.puntaDeAnca, categoria:"Cortes",
        descripcion:"Ribeye madurado en seco, 300g. Marmoleo perfecto, sabor inigualable.",
        precio:75000, tiene_termino:true,
        opciones:[{nombre:"Papas al romero",precio:0},{nombre:"Puré de papa",precio:0}],
        adiciones:[{nombre:"Queso azul",precio:5000},{nombre:"Salsa chimichurri",precio:4000}],
      },
    ],
    "Sushi": [
      {
        nombre:"Roll California", img:imagenes.california, categoria:"Sushi",
        descripcion:"Arroz de sushi, cangrejo, aguacate, pepino, tobiko. 8 piezas.",
        precio:26000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Salsa spicy",precio:2000},{nombre:"Tobiko extra",precio:3000}],
      },
      {
        nombre:"Roll Spicy Tuna", img:imagenes.spicytuna, categoria:"Sushi",
        descripcion:"Atún fresco con mayonesa spicy, aguacate y cebollín. 8 piezas.",
        precio:32000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Salsa de soya extra",precio:1000},{nombre:"Jengibre extra",precio:1500}],
      },
      {
        nombre:"Burrito Roll", img:imagenes.burrito, categoria:"Sushi",
        descripcion:"Roll estilo burrito con arroz de sushi, pollo, aguacate y queso crema.",
        precio:29000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Salsa spicy",precio:2000},{nombre:"Queso extra",precio:2500}],
      },
    ],
    "Comida Vegana": [
      {
        nombre:"Bowl de Quinoa", img:imagenes.quinoa, categoria:"Comida Vegana",
        descripcion:"Quinoa tricolor, garbanzos al horno, kale, tomates cherry y tahini de limón.",
        precio:24000, tiene_termino:false,
        opciones:[{nombre:"Con aguacate",precio:0},{nombre:"Sin aguacate",precio:0}],
        adiciones:[{nombre:"Tofu marinado",precio:5000},{nombre:"Semillas de chía",precio:2000}],
      },
      {
        nombre:"Burger Vegana", img:imagenes.burgerVeg, categoria:"Comida Vegana",
        descripcion:"Pan artesanal, medallón de lentejas y betabel, lechuga, tomate y mayonesa vegana.",
        precio:26000, tiene_termino:false,
        opciones:[{nombre:"Papas al horno",precio:0},{nombre:"Ensalada de kale",precio:0}],
        adiciones:[{nombre:"Queso vegano",precio:4000},{nombre:"Aguacate extra",precio:3000}],
      },
      {
        nombre:"Cazuela Vegana", img:imagenes.cazuela, categoria:"Comida Vegana",
        descripcion:"Cazuela cremosa de verduras, garbanzos y leche de coco con hierbas frescas.",
        precio:22000, tiene_termino:false,
        opciones:[], adiciones:[{nombre:"Pan artesanal",precio:3000},{nombre:"Arroz integral",precio:2000}],
      },
    ],
    "Quesos": [
      {
        nombre:"Tabla de Quesos Premium", img:imagenes.tablaQuesos, categoria:"Quesos",
        descripcion:"Selección de 4 quesos: brie, gouda añejo, manchego y azul. Con mermelada y frutos secos.",
        precio:45000, tiene_termino:false,
        opciones:[],
        adiciones:[{nombre:"Vino de la casa (copa)",precio:18000},{nombre:"Pan baguette extra",precio:5000}],
      },
      {
        nombre:"Fondue de Queso", img:imagenes.fondue, categoria:"Quesos",
        descripcion:"Fondue cremoso de gruyère y emmental con pan rústico, vegetales y charcutería.",
        precio:38000, tiene_termino:false,
        opciones:[],
        adiciones:[{nombre:"Papas baby asadas",precio:6000},{nombre:"Manzana en rodajas",precio:3000}],
      },
      {
        nombre:"Deditos de Queso", img:imagenes.deditos, categoria:"Quesos",
        descripcion:"Deditos crocantes rellenos de queso fundido. Perfectos para compartir.",
        precio:16000, tiene_termino:false,
        opciones:[],
        adiciones:[{nombre:"Salsa BBQ",precio:1500},{nombre:"Salsa rosada",precio:1500}],
      },
    ],
    "Bar": {
      Licores:[
        {
          nombre:        "Aguardiente Antioqueño",
          img:           imagenes.aguardiente,
          categoria:     "Bar",
          descripcion:   "Aguardiente antioqueño botella personal, frío.",
          precio:        12000,
          tiene_termino: false,
          opciones:  [{ nombre:"Con hielo", precio:0 }, { nombre:"Sin hielo", precio:0 }],
          adiciones: [{ nombre:"Limón extra", precio:1000 }],
        },
      ],
      Cervezas:[],
      Jugos:[
        {
          nombre:"Jugo Natural", img:imagenes.jugo, categoria:"Bar",
          descripcion:"Jugo natural de la fruta del día, sin azúcar o con azúcar al gusto.",
          precio:8000, tiene_termino:false,
          opciones:[{nombre:"Con azúcar",precio:0},{nombre:"Sin azúcar",precio:0},{nombre:"Con leche",precio:0}],
          adiciones:[],
        },
      ],
      Micheladas:[],
      Gaseosas:[],
      Malteadas:[],
    },
  };

  // ── Decisión: ¿qué datos usar? ────────────────────────────
  // Si el restaurante ya tiene productos en la BD, se usan esos.
  // Si NO tiene productos todavía:
  //   - El restaurante demo (RESTAURANTE_DEMO_ID) cae al menú
  //     estático de ejemplo (comportamiento legacy).
  //   - Cualquier otro restaurante nuevo arranca con el menú
  //     realmente vacío ({}) para ver SU propia plantilla vacía,
  //     no la comida de otro tenant.
  const tieneProductosBD  = Object.keys(menuDB).length > 0;
  const esRestauranteDemo = String(restauranteId) === RESTAURANTE_DEMO_ID;
  const dataFinal = tieneProductosBD ? menuDB : (esRestauranteDemo ? menuData : {});
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
  // Si es el restaurante demo y todavía no tiene datos propios en
  // la BD, se usa la selección estática de siempre. Para cualquier
  // otro restaurante, los destacados salen de sus propios productos
  // reales (los primeros que encuentre) — y si aún no tiene ninguno,
  // simplemente no hay nada que destacar.
  const destacados = (esRestauranteDemo && !tieneProductosBD)
    ? [menuData["Platos fuertes"]?.[0], menuData["Cortes"]?.[0], menuData["Platos típicos"]?.[1]].filter(Boolean)
    : Object.values(dataFinal)
        .flatMap(val => (typeof val === "object" && !Array.isArray(val)) ? Object.values(val).flat() : (Array.isArray(val) ? val : []))
        .slice(0, 3);

  // ── addToCart: agregar producto al carrito ─────────────────
  const addToCart = item => {
    const imgKey = Object.entries(imagenes).find(([k,v]) => v === item.img)?.[0] || null;
    setCart(prev => {
      const opcionKey = Array.isArray(item.opcion) ? item.opcion.join(",") : (item.opcion || "");
      const key = `${item.nombre}|${item.termino||""}|${opcionKey}|${(item.adiciones||[]).join(",")}`;
      const existe = prev.find(c => c._key === key);
      if (existe) return prev.map(c => c._key===key ? {...c,qty:c.qty+1} : c);
      return [...prev, {...item, _key:key, qty:1, imgKey}];
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
  // 👇 SaaS: ahora se manda mesa_id (el id real que viene en la URL
  // del QR) en vez de mesa_nombre. Así el backend usa la mesa exacta
  // del menú, sin tener que adivinarla buscando por texto.
  const handlePagar = async () => {
    if (enviandoPedido) return;

    if (!quejaMesa.trim()) {
      alert("Por favor ingresa el número de tu mesa antes de confirmar el pedido.");
      return;
    }

    setEnviandoPedido(true);

    const comidas = cart.filter(c => !BAR_CATS.includes(c.categoria));
    const bebidas = cart.filter(c =>  BAR_CATS.includes(c.categoria));

    // 1. Enviar comidas a cocina
    if (comidas.length > 0) {
      try {
        await fetch(`${API_URL}/pedidos-cocina`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurante_id: restauranteId,
            mesa_id: mesaId, // 👈 antes: mesa_nombre: quejaMesa
            observacion: null,
            items: comidas.map(c => ({
              nombre:      c.nombre,
              cantidad:    c.qty,
              precio:      c.precio,
              categoria:   "comida",
              imgKey:      c.imgKey || null,
              imagen:      c.imgKey || null,
              observacion: [c.termino, ...(c.opcion || []), ...(c.adiciones || [])]
                .filter(Boolean).join(", ") || null,
            })),
          }),
        });
      } catch (err) {
        console.error("❌ Error enviando a cocina:", err);
      }
    }

    // 2. Enviar bebidas al bar
    // ⚠️ Pendiente: confirmar con el backend de /bar/orden si esa ruta
    // ya soporta mesa_id o todavía espera "mesa" como texto, antes de
    // cambiar esto igual que arriba.
    if (bebidas.length > 0) {
      try {
        await fetch(`${API_URL}/bar/ordenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurante_id: restauranteId,
            mesa: quejaMesa,
            items: bebidas.map(b => ({
              nombre:    b.nombre,
              cantidad:  b.qty,
              imgKey:    b.imgKey || null,
              adiciones: b.adiciones || [],
              opcion:    b.opcion || [],
            })),
          }),
        });
      } catch (err) {
        console.error("❌ Error enviando al bar:", err);
      }
    }

    setPagado(true);
    setEnviandoPedido(false);
    setTimeout(() => {
      setPagado(false);
      setCart([]);
      setCartOpen(false);
      setQuejaMesa(mesaId ? String(mesaId) : "");
    }, 4000);
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
                  nombre: prod.nombre, img: imagenes[prod.imagen] || null,
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
                  img: imagenes[prod.imagen] || null,
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
    <div key={i} className="food-card-wrapper">
      <div className="card-media" onClick={() => setSelectedItem(item)}>
        <FoodCard item={item} />

        <button className={`fav-btn ${isFav(item.nombre)?"active":""}`}
          onClick={e => { e.stopPropagation(); toggleFav(item); }}>
          {isFav(item.nombre) ? "❤️" : "🤍"}
        </button>

        {esAdmin && item.id && (
          <button className="edit-btn"
            onClick={e => { e.stopPropagation(); setEditProducto({ ...item, imagen: Object.entries(imagenes).find(([,v]) => v === item.img)?.[0] || "" }); setEditModal(true); }}>
            ✏️
          </button>
        )}
      </div>

      <div className="card-body" onClick={() => setSelectedItem(item)}>
        <h3 className="card-title">{item.nombre}</h3>
        {item.descripcion && <p className="card-desc">{item.descripcion}</p>}

        <div className="card-footer">
          <span className="card-price">{fmtCOP(item.precio)}</span>
          <button className="add-btn" onClick={e => { e.stopPropagation(); setSelectedItem(item); }}>+</button>
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
                <select className="queja-mesa-input"
                  value={nuevoProducto.categoria_id}
                  onChange={e => {
                    const sel = categoriasBD.find(c => c.id === Number(e.target.value));
                    setNuevoProducto(p => ({ ...p, categoria_id: e.target.value, _catNombre: sel?.nombre || "", subcategoria: "" }));
                  }}
                  style={{ cursor: "pointer" }}>
                  <option value="" style={{ color: "#000" }}>Selecciona una categoría</option>
                  {categoriasBD.map(c => (
                    <option key={c.id} value={c.id} style={{ color: "#000" }}>
                      {catIconos[c.nombre] || "🍴"} {c.nombre}
                    </option>
                  ))}
                </select>
                {categoriasBD.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "6px" }}>
                    Cargando categorías...
                  </p>
                )}
                {nuevoProducto._catNombre === "Bar" && (
                  <select className="queja-mesa-input" style={{ cursor: "pointer", marginTop: "8px" }}
                    value={nuevoProducto.subcategoria || ""}
                    onChange={e => setNuevoProducto(p => ({ ...p, subcategoria: e.target.value }))}>
                    <option value="" style={{ color: "#000" }}>Selecciona subcategoría del Bar</option>
                    {BAR_SUBS.map(s => <option key={s} value={s} style={{ color: "#000" }}>{BAR_ICONS[s]} {s}</option>)}
                  </select>
                )}
              </div>

              <div className="modal-section">
                <p className="modal-section-title">Imagen</p>
                <select className="queja-mesa-input"
                  value={nuevoProducto.imagen}
                  onChange={e => setNuevoProducto(p => ({ ...p, imagen: e.target.value }))}
                  style={{ cursor: "pointer" }}>
                  <option value="" style={{ color: "#000" }}>Sin imagen</option>
                  {Object.keys(imagenes).map(k => (
                    <option key={k} value={k} style={{ color: "#000" }}>{k}</option>
                  ))}
                </select>
                {nuevoProducto.imagen && imagenes[nuevoProducto.imagen] && (
                  <img
                    src={imagenes[nuevoProducto.imagen]}
                    alt={nuevoProducto.imagen}
                    style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px", marginTop: "10px" }}
                  />
                )}
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
                <select className="queja-mesa-input" value={editProducto.imagen || ""}
                  onChange={e => setEditProducto(p => ({ ...p, imagen: e.target.value }))}
                  style={{ cursor: "pointer" }}>
                  <option value="" style={{ color: "#000" }}>Sin imagen</option>
                  {Object.keys(imagenes).map(k => (
                    <option key={k} value={k} style={{ color: "#000" }}>{k}</option>
                  ))}
                </select>
                {editProducto.imagen && imagenes[editProducto.imagen] && (
                  <img src={imagenes[editProducto.imagen]} alt={editProducto.imagen}
                    style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px", marginTop: "10px" }} />
                )}
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
            <h3>¡Pedido registrado!</h3>
            <p>Dirígete a caja a pagar 🎉</p>
          </div>
        ) : cart.length===0 ? (
          <p className="cart-empty">Aún no has agregado nada 🍽️</p>
        ) : (
          <>
            <div style={{ padding: "14px 22px 0" }}>
              <input
                type="text"
                placeholder="¿Cuál es tu mesa? (ej: Mesa 3)"
                value={quejaMesa}
                onChange={e => setQuejaMesa(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "#fff",
                  fontSize: "14px",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  outline: "none",
                }}
              />
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
      </div>

      <div className="top-bar">
        <span className="menu-icon" onClick={() => setMenuOpen(true)}>☰</span>
        <h1>Mesa<span>Smart</span></h1>
        <button className="cart-icon-btn" onClick={() => setCartOpen(true)}>
          🛒 {totalItems>0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>

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
              value={quejaMesa} onChange={e => setQuejaMesa(e.target.value)}/>
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