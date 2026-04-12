import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";
import FoodCard from "../components/FoodCard";
import { imagenes } from "../data/imagenes";

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

const BAR_CATS  = ["Bar", "Bebidas"];
const BAR_SUBS  = ["Licores","Cervezas","Jugos","Micheladas","Gaseosas","Malteadas"];
const BAR_ICONS = { Licores:"🥃", Cervezas:"🍺", Jugos:"🍊", Micheladas:"🍻", Gaseosas:"🥤", Malteadas:"🍦" };
const TERMINOS  = ["Poco hecho","Término medio","Bien hecho","Muy bien hecho"];
const fmtCOP    = n => `$${Number(n).toLocaleString("es-CO")}`;

const ProductModal = ({ item, onClose, onAddToCart }) => {
  const [termino,   setTermino]   = useState(null);
  const [opcionSel, setOpcionSel] = useState(null);
  const [adiciones, setAdiciones] = useState([]);

  if (!item) return null;

  const opciones      = item.opciones  || [];
  const adicionesDisp = item.adiciones || [];

  const toggleAdicion = nombre =>
    setAdiciones(prev => prev.includes(nombre) ? prev.filter(a=>a!==nombre) : [...prev,nombre]);

  const precioAdiciones = adicionesDisp
    .filter(a => adiciones.includes(a.nombre))
    .reduce((s,a) => s + Number(a.precio), 0);

  const precioTotal = Number(item.precio || 0) + precioAdiciones;

const handlePagar = async () => {
  const bebidas = cart.filter(c =>
    c.categoria === "Bar" || c.categoria === "Bebidas" ||
    BAR_CATS.includes(c.categoria)
  );

  if (bebidas.length > 0) {
    try {
      await fetch("http://localhost:3001/api/bar/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa: quejaMesa || "Sin mesa",
items: bebidas.map(b => ({
  nombre:    b.nombre,
  cantidad:  b.qty,
  imgKey:    b.imgKey || null,   // ← clave string, no el import
  adiciones: b.adiciones || [],
  opcion:    b.opcion || null,
})),
        }),
      });
    } catch (err) {
      console.error("Error enviando al bar:", err);
    }
  }

  setPagado(true);
  setTimeout(() => { setPagado(false); setCart([]); setCartOpen(false); }, 4000);
};

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
                <div key={i} className={`opcion-row ${opcionSel===op.nombre?"selected":""}`} onClick={()=>setOpcionSel(op.nombre)}>
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
          <button className="modal-add-btn" onClick={() => { onAddToCart({ ...item, termino, opcion: opcionSel, adiciones }); onClose(); }}>
            Agregar al pedido — {fmtCOP(precioTotal)}
          </button>
        </div>
      </div>
    </div>
  );
};

const Menu = () => {
  const navigate = useNavigate();

  const [categoria,    setCategoria]    = useState(null);
  const [subCategoria, setSubCategoria] = useState(null);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [menuDB,       setMenuDB]       = useState({});
  const [cartOpen,     setCartOpen]     = useState(false);
  const [cart,         setCart]         = useState([]);
  const [pagado,       setPagado]       = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [favs,         setFavs]         = useState([]);
  const [activeTab,    setActiveTab]    = useState("home");
  const [quejaMsg,     setQuejaMsg]     = useState("");
  const [quejaMesa,    setQuejaMesa]    = useState("");
  const [quejaSent,    setQuejaSent]    = useState(false);
  const [quejaLoading, setQuejaLoading] = useState(false);
  const [searchText,   setSearchText]   = useState("");
  const [addModal,     setAddModal]     = useState(false);
  const [categoriasBD, setCategoriasBD] = useState([]);
const [nuevoProducto, setNuevoProducto] = useState({
  nombre: "", descripcion: "", precio: "", categoria_id: "", _catNombre: "", subcategoria: "", imagen: "", adiciones: []
});
  const [nuevaAdicion, setNuevaAdicion] = useState({ nombre: "", precio: "" });
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [editModal,     setEditModal]     = useState(false);
const [editProducto,  setEditProducto]  = useState(null);
const [editando,      setEditando]      = useState(false);
const [editOk,        setEditOk]        = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/api/menu")
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
            // ✅ guardamos subcategoria tal como viene de la BD
            subcategoria:  prod.subcategoria || null,
            categoria:     prod.categoria,
          });
        });
        setMenuDB(organizado);
      })
      .catch(err => console.error("Error BD:", err));
  }, []);

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
      img:           imagenes.aguardiente,   // debe existir en imagenes.js
      categoria:     "Bar",
      descripcion:   "Aguardiente antioqueño botella personal, frío.",
      precio:        12000,
      tiene_termino: false,
      opciones:  [{ nombre:"Con hielo", precio:0 }, { nombre:"Sin hielo", precio:0 }],
      adiciones: [{ nombre:"Limón extra", precio:1000 }],
    },
      ],Cervezas:[],Jugos:[
        {
          nombre:"Jugo Natural", img:imagenes.jugo, categoria:"Bar",
          descripcion:"Jugo natural de la fruta del día, sin azúcar o con azúcar al gusto.",
          precio:8000, tiene_termino:false,
          opciones:[{nombre:"Con azúcar",precio:0},{nombre:"Sin azúcar",precio:0},{nombre:"Con leche",precio:0}],
          adiciones:[],
        },
      ],Micheladas:[],Gaseosas:[],Malteadas:[],
    },
  };

  const destacados = [
    menuData["Platos fuertes"][0],
    menuData["Cortes"][0],
    menuData["Platos típicos"][1],
  ];

  const dataFinal = Object.keys(menuDB).length ? menuDB : menuData;

const addToCart = item => {
  const imgKey = Object.entries(imagenes).find(([k,v]) => v === item.img)?.[0] || null;
  setCart(prev => {
    const key = `${item.nombre}|${item.termino||""}|${item.opcion||""}|${(item.adiciones||[]).join(",")}`;
    const existe = prev.find(c => c._key === key);
    if (existe) return prev.map(c => c._key===key ? {...c,qty:c.qty+1} : c);
    return [...prev, {...item, _key:key, qty:1, imgKey}];
  });
};

  const removeOne = key => {
    setCart(prev => {
      const existe = prev.find(c => c._key===key);
      if (existe?.qty===1) return prev.filter(c=>c._key!==key);
      return prev.map(c => c._key===key ? {...c,qty:c.qty-1} : c);
    });
  };

  const totalItems  = cart.reduce((a,c) => a+c.qty, 0);
  const totalPrecio = cart.reduce((a,c) => a+c.precio*c.qty, 0);

const handlePagar = async () => {
  const bebidas = cart.filter(c =>
    c.categoria === "Bar" || c.categoria === "Bebidas" ||
    BAR_CATS.includes(c.categoria)
  );

  if (bebidas.length > 0) {
    try {
      await fetch("http://localhost:3001/api/bar/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesa: quejaMesa || "Sin mesa",
          items: bebidas.map(b => ({
            nombre:    b.nombre,
            cantidad:  b.qty,
            imgKey:    b.imgKey || null,
            adiciones: b.adiciones || [],
            opcion:    b.opcion || null,
          })),
        }),
      });
    } catch (err) {
      console.error("Error enviando al bar:", err);
    }
  }

  setPagado(true);
  setTimeout(() => { setPagado(false); setCart([]); setCartOpen(false); }, 4000);
};

useEffect(() => {
    if (addModal && categoriasBD.length === 0) {
      fetch("http://localhost:3001/api/menu/categorias")
        .then(r => r.json())
        .then(setCategoriasBD)
        .catch(() => {});
    }
  }, [addModal]);

  const handleGuardarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.categoria_id) return;
    setGuardando(true);
    try {
      const res = await fetch("http://localhost:3001/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoProducto, precio: Number(nuevoProducto.precio) }),
      });
      if (res.ok) {
        setGuardadoOk(true);
        setNuevoProducto({ nombre: "", descripcion: "", precio: "", categoria_id: "", _catNombre: "", subcategoria: "", imagen: "", adiciones: [] });
        setTimeout(() => {
          setGuardadoOk(false);
          setAddModal(false);
          // Recargar menú desde BD
          fetch("http://localhost:3001/api/menu")
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

  const handleEditarProducto = async () => {
  if (!editProducto?.id || !editProducto.nombre || !editProducto.precio) return;
  setEditando(true);
  try {
    const res = await fetch(`http://localhost:3001/api/menu/${editProducto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
        fetch("http://localhost:3001/api/menu")
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

  const toggleFav = item =>

 
    setFavs(prev => prev.find(f=>f.nombre===item.nombre) ? prev.filter(f=>f.nombre!==item.nombre) : [...prev,item]);
  const isFav = nombre => favs.some(f=>f.nombre===nombre);

  const handleEnviarQueja = async () => {
    if (!quejaMsg.trim()) return;
    setQuejaLoading(true);
    try {
      await fetch("http://localhost:3001/api/quejas", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({mesa:quejaMesa, mensaje:quejaMsg}),
      });
      setQuejaSent(true); setQuejaMsg(""); setQuejaMesa("");
      setTimeout(() => setQuejaSent(false), 5000);
    } catch(err) { console.error(err); }
    setQuejaLoading(false);
  };

  const allProductos = Object.values(dataFinal).flatMap(val =>
    typeof val==="object" && !Array.isArray(val) ? Object.values(val).flat() : Array.isArray(val) ? val : []
  );
  const productosFiltrados = searchText.trim()
    ? allProductos.filter(p => p.nombre?.toLowerCase().includes(searchText.toLowerCase()))
    : null;

const renderCard = (item, i) => (
  <div key={i} className="food-card-wrapper">
    <div onClick={() => setSelectedItem(item)}>
      <FoodCard item={item} />
    </div>
    <button className={`fav-btn ${isFav(item.nombre)?"active":""}`}
      onClick={e => { e.stopPropagation(); toggleFav(item); }}>
      {isFav(item.nombre) ? "❤️" : "🤍"}
    </button>
    <button className="add-btn" onClick={e => { e.stopPropagation(); setSelectedItem(item); }}>+</button>
    {item.id && (
      <button onClick={e => { e.stopPropagation(); setEditProducto({ ...item, imagen: Object.entries(imagenes).find(([,v]) => v === item.img)?.[0] || "" }); setEditModal(true); }}
        style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:"28px", height:"28px", cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        ✏️
      </button>
    )}
  </div>
);

  // ✅ CORREGIDO: maneja array plano de BD y objeto anidado del fallback
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

  return (
    <div className="menu-container">

      {/* MODAL AGREGAR PRODUCTO */}
      {addModal && (
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

              {/* MODAL EDITAR PRODUCTO */}
{editModal && editProducto && (
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
    {categoriasBD.length > 0
      ? categoriasBD.map(c => (
          <option key={c.id} value={c.id} style={{ color: "#000" }}>
            {catIconos[c.nombre] || "🍴"} {c.nombre}
          </option>
        ))
      : (
        <>
          <option value="1" style={{ color: "#000" }}>🍽️ Platos fuertes</option>
          <option value="2" style={{ color: "#000" }}>🥗 Entradas</option>
          <option value="3" style={{ color: "#000" }}>🫕 Platos típicos</option>
          <option value="4" style={{ color: "#000" }}>🍝 Pastas</option>
          <option value="5" style={{ color: "#000" }}>🥩 Cortes</option>
          <option value="6" style={{ color: "#000" }}>🍣 Sushi</option>
          <option value="7" style={{ color: "#000" }}>🌱 Comida Vegana</option>
          <option value="8" style={{ color: "#000" }}>🧀 Quesos</option>
          <option value="9" style={{ color: "#000" }}>🍹 Bar</option>
        </>
      )
    }
  </select>
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
                  }} style={{ background: "#ff8c32", border: "none", color: "#fff", borderRadius: "10px", padding: "0 14px", cursor: "pointer", fontSize: "18px" }}>
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

      {selectedItem && (
        <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={addToCart} />
      )}

      {/* SIDEBAR */}
      <div className={`sidebar ${menuOpen?"open":""}`}>
        <div className="sidebar-top">
          <span className="sidebar-title">MesaSmart</span>
          <button className="sidebar-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <p onClick={() => { setMenuOpen(false); setCategoria(null); setSubCategoria(null); navigate("/menu"); }}>🏠&nbsp; Inicio</p>
          {Object.keys(dataFinal).map(cat => (
            <p key={cat} onClick={() => { setMenuOpen(false); setCategoria(cat); setSubCategoria(null); setActiveTab("menu"); }}>
              {catIconos[cat]||"🍴"}&nbsp; {cat}
            </p>
          ))}
          <hr className="sidebar-hr"/>
          <p className="sidebar-logout" onClick={() => { setMenuOpen(false); navigate("/"); }}>🚪&nbsp; Cerrar sesión</p>
        </nav>
      </div>
      {menuOpen && <div className="overlay-bg" onClick={() => setMenuOpen(false)}/>}

      {/* CARRITO */}
      {cartOpen && <div className="overlay-bg" onClick={() => setCartOpen(false)}/>}
      <div className={`cart-panel ${cartOpen?"open":""}`}>
<div className="cart-panel-header">
  <h2>Tu pedido 🛒</h2>
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
    {/* ── INPUT DE MESA ── */}
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
          fontFamily: "DM Sans, sans-serif",
          outline: "none",
        }}
      />
    </div>

    <ul className="cart-list">
      {cart.map((c,i) => (
        <li key={i} className="cart-item">
          <div className="cart-item-info">
            <span className="cart-item-name">{c.nombre}</span>
            {(c.termino||c.opcion||c.adiciones?.length>0) && (
              <span className="cart-item-meta">
                {[c.termino,c.opcion,...(c.adiciones||[])].filter(Boolean).join(" · ")}
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
    <button className="cart-pay-btn" onClick={handlePagar}>Pagar {fmtCOP(totalPrecio)}</button>
  </>
)}
</div>

      {/* HEADER */}
      <div className="top-bar">
        <span className="menu-icon" onClick={() => setMenuOpen(true)}>☰</span>
        <h1>Mesa<span>Smart</span></h1>
        <button className="cart-icon-btn" onClick={() => setCartOpen(true)}>
          🛒 {totalItems>0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="search-row">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Buscar platos..." value={searchText} onChange={e => setSearchText(e.target.value)}/>
        </div>
      </div>

      {/* BÚSQUEDA */}
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

      {/* TAB HOME */}
      {activeTab==="home" && !searchText.trim() && (
        <>
          <div className="section-header">
           <h2>Categorías</h2>
            <button onClick={() => setAddModal(true)} style={{ background: "#ff8c32", border: "none", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px" }}>+</button>
            <span className="show-all" onClick={() => setActiveTab("menu")}>Ver todo ›</span>
          </div>
          <div className="categories">
            {Object.keys(dataFinal).map(cat => (
              <div key={cat} className={`category-card ${categoria===cat?"active":""}`}
                onClick={() => { setCategoria(cat); setSubCategoria(null); setActiveTab("menu"); }}>
                <span className="cat-icon">{catIconos[cat]||"🍴"}</span>
                <span>{cat}</span>
              </div>
            ))}
          </div>
          <p className="section-title">⭐ Recomendados</p>
          <div className="cards">{destacados.map((item,i) => renderCard(item,i))}</div>
          {favs.length>0 && (
            <>
              <p className="section-title">❤️ Tus favoritos</p>
              <div className="cards">{favs.map((item,i) => renderCard(item,i))}</div>
            </>
          )}
        </>
      )}

      {/* TAB MENÚ */}
      {activeTab==="menu" && !searchText.trim() && (
        <>
          <div className="section-header">
            <h2>Categorías</h2>
            <button onClick={() => setAddModal(true)} style={{ background: "#ff8c32", border: "none", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px" }}>+</button>
            <span className="show-all" onClick={() => { setCategoria(null); setSubCategoria(null); }}>Ver todo ›</span>
          </div>
          <div className="categories">
            {Object.keys(dataFinal).map(cat => (
              <div key={cat} className={`category-card ${categoria===cat?"active":""}`}
                onClick={() => { setCategoria(cat); setSubCategoria(null); }}>
                <span className="cat-icon">{catIconos[cat]||"🍴"}</span>
                <span>{cat}</span>
              </div>
            ))}
          </div>

          {/* Subcategorías Bar/Bebidas */}
          {BAR_CATS.includes(categoria) && (
            <div className="categories">
              {BAR_SUBS.map(sub => (
                <div key={sub} className={`category-card ${subCategoria===sub?"active":""}`}
                  onClick={() => setSubCategoria(sub)}>
                  <span className="cat-icon">{BAR_ICONS[sub]}</span>
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hint cuando no hay subcategoría seleccionada en Bar */}
          {BAR_CATS.includes(categoria) && !subCategoria && (
            <p style={{color:"rgba(255,255,255,0.35)", padding:"8px 24px 20px", fontSize:"14px"}}>
              Selecciona una subcategoría 👆
            </p>
          )}

          {/* Productos de categoría normal */}
          {categoria && !BAR_CATS.includes(categoria) && (
            <>
              <p className="section-title">{catIconos[categoria]} {categoria}</p>
              <div className="cards">{(dataFinal[categoria]||[]).map((item,i) => renderCard(item,i))}</div>
            </>
          )}

          {/* Productos de Bar/Bebidas según subcategoría */}
          {BAR_CATS.includes(categoria) && subCategoria && (
            <>
              <p className="section-title">{BAR_ICONS[subCategoria]} {subCategoria}</p>
              <div className="cards">
                {getBarItems(categoria, subCategoria).length > 0
                  ? getBarItems(categoria, subCategoria).map((item,i) => renderCard(item,i))
                  : <p style={{color:"rgba(255,255,255,0.35)",padding:"0 0 20px",gridColumn:"1/-1",fontSize:"14px"}}>
                      No hay productos en esta subcategoría aún.
                    </p>
                }
              </div>
            </>
          )}

          {/* Ver todo — todas las categorías sin filtro */}
          {!categoria && Object.keys(dataFinal).filter(k => !BAR_CATS.includes(k)).map(cat => (
            <div key={cat}>
              <p className="section-title">{catIconos[cat]||"🍴"} {cat}</p>
              <div className="cards">{(dataFinal[cat]||[]).map((item,i) => renderCard(item,i))}</div>
            </div>
          ))}
        </>
      )}

      {/* TAB FAVORITOS */}
      {activeTab==="favs" && (
        <div className="favs-container">
          <p className="section-title">❤️ Mis favoritos</p>
          {favs.length===0
            ? <p className="favs-empty">Aún no tienes favoritos.<br/>Toca el 🤍 en cualquier plato.</p>
            : <div className="cards">{favs.map((item,i) => renderCard(item,i))}</div>
          }
        </div>
      )}

      {/* TAB AVISOS */}
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