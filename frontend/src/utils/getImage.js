// frontend/src/utils/getImage.js
import { imagenes } from "../data/imagenes";

const MAPEO = {
  hamburguesa: "hamburguesa",
  "hamburguesa clasica": "hamburguesa",
  "alitas bbq": "alitas",
  alitas: "alitas",
  "bandeja paisa": "bandeja",
  bandeja: "bandeja",
  patacon: "patacon",
  patacón: "patacon",
  "lasaña de carne": "lasana",
  lasaña: "lasana",
  lasana: "lasana",
  "carbonara clasica": "carbonara",
  carbonara: "carbonara",
  "pasta pesto": "pesto",
  pesto: "pesto",
  ribeye: "ribeye",
  solomito: "solomito",
  strip: "strip",
  california: "california",
  "spicy tuna": "spicytuna",
  spicytuna: "spicytuna",
  "quinoa bowl": "quinoa",
  quinoa: "quinoa",
  "burger veg": "burgerVeg",
  "burger veggie": "burgerVeg",
  "tabla de quesos": "tablaQuesos",
  fondue: "fondue",
  crispetas: "crispetas",
  chicharron: "chicharron",
  chicharrón: "chicharron",
  "deditos de queso": "deditos",
  deditos: "deditos",
  empanadas: "empanadas",
  frijoles: "frijoles",
  "jugo natural": "jugo",
  jugo: "jugo",
  mondongo: "mondongo",
  "pechuga plancha": "pechuga",
  pechuga: "pechuga",
  sancocho: "sancocho",
  "sudado de pollo": "sudado",
  sudado: "sudado",
  cazuela: "cazuela",
  burrito: "burrito",
  carpaccio: "carpaccio",
  "punta de anca": "puntaDeAnca",
  "punta deanca": "puntaDeAnca",
  aguardiente: "aguardiente",
  smirnoff: "smirnoff",
  aguila: "aguila",
  corona: "corona",
  "aguila light": "aguilaLight",
  cuates: "cuates",
  jugos: "jugos",
  "jugos naturales": "jugos",
  michelada: "michelada",
  "michelada saborizada": "micheladaSaborizada",
  gaseosas: "gaseosas",
  "malteada chp": "malteadachp",
  malteada: "malteadachp",
  "perro caliente": "perroCaliente",
  perro: "perroCaliente",
  "pollo asado": "polloAsado",
  pollo: "polloAsado",
};

const normalizar = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");

export const getImage = (nombre, imgKey) => {
  // 1. Si viene imgKey explícito y existe, se usa directo
  if (imgKey && imagenes[imgKey]) {
    return imagenes[imgKey];
  }

  if (!nombre) return null;

  const normalized = normalizar(nombre);

  // 2. Coincidencia exacta en el mapeo
  if (MAPEO[normalized] && imagenes[MAPEO[normalized]]) {
    return imagenes[MAPEO[normalized]];
  }

  // 3. Sin espacios, coincidencia exacta en imagenes
  const sinEspacios = normalized.replace(/\s/g, "");
  if (imagenes[sinEspacios]) return imagenes[sinEspacios];

  // 4. NUEVO: coincidencia "contiene" — soluciona nombres como
  //    "Ribeye 300g", "Hamburguesa Especial", "Alitas BBQ x10", etc.
  //    Se queda con la clave más larga que aparezca dentro del nombre,
  //    para evitar falsos positivos con claves cortas.
  let mejorMatch = null;
  let mejorLargo = 0;
  for (const [clave, valor] of Object.entries(MAPEO)) {
    if (normalized.includes(clave) && clave.length > mejorLargo) {
      mejorMatch = valor;
      mejorLargo = clave.length;
    }
  }
  if (mejorMatch && imagenes[mejorMatch]) return imagenes[mejorMatch];

  return null;
};

export { imagenes };