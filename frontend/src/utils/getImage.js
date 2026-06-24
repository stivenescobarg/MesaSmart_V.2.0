// frontend/src/utils/getImage.js
import { imagenes } from "../data/imagenes";

// Mapeo manual para nombres que no coinciden exactamente
const MAPEO = {
  // Platos
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
  // Bebidas
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

export const getImage = (nombre, imgKey) => {
  // Si hay imgKey y existe en imagenes, lo usamos
  if (imgKey && imagenes[imgKey]) {
    return imagenes[imgKey];
  }

  if (!nombre) return null;

  // Normalizar: minúsculas, sin tildes, espacios simples
  let normalized = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  // Buscar en mapeo
  if (MAPEO[normalized]) {
    const key = MAPEO[normalized];
    if (imagenes[key]) return imagenes[key];
  }

  // Quitar espacios y buscar
  const sinEspacios = normalized.replace(/\s/g, "");
  if (imagenes[sinEspacios]) return imagenes[sinEspacios];

  return null;
};

// Exportar también imagenes por si acaso
export { imagenes };