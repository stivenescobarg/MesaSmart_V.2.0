// ============================================================
// seed.js — Script para poblar la base de datos con datos iniciales
// ============================================================
// Este script se ejecuta UNA sola vez (o cuando se quiera resetear
// la base de datos) para insertar todos los productos, categorías,
// subcategorías y opciones del menú del restaurante.
//
// ¿Por qué existe esto?
// En lugar de insertar los datos a mano en MySQL o tener que
// crear cada producto desde la app, este script automatiza todo.
// Es especialmente útil para configurar el proyecto desde cero.
//
// Cómo ejecutarlo:
//   node seed.js  (desde la carpeta del backend)
//
// ADVERTENCIA: Este script BORRA y recrea todos los datos de
// las tablas de productos, categorías y opciones.
// NO ejecutar en producción si ya hay datos reales.
// ============================================================

const mysql = require("mysql2");
require("dotenv").config(); // Carga las variables de entorno del archivo .env

// ── Configuración de la conexión a MySQL ──────────────────────
// Las credenciales se leen del archivo .env para no hardcodearlas.
// Si no existe el .env, usa valores por defecto (localhost, root, etc.)
const conn = mysql.createConnection({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || process.env.DB_DATABASE || "mesasmart",
  port:     process.env.DB_PORT     || 3306,
});

// ── Función helper: convertir callback a Promise ─────────────
// mysql2 trabaja con callbacks por defecto. Esta función
// nos permite usar async/await para escribir código más limpio.
function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}


// ── Función principal del seed ───────────────────────────────
async function seed() {
  try {
    console.log("🌱 Iniciando seed COMPLETO de MesaSmart...\n");

    // ── PASO 0: Limpiar tablas existentes ─────────────────────
    // Desactivamos las foreign keys temporalmente para poder
    // truncar las tablas sin errores de integridad referencial.
    // El orden importa: primero las tablas dependientes, luego las principales.
    await q("SET FOREIGN_KEY_CHECKS = 0");
    await q("TRUNCATE TABLE productos_opciones"); // Tabla relacional (N:M)
    await q("TRUNCATE TABLE opciones");
    await q("TRUNCATE TABLE productos");
    await q("TRUNCATE TABLE subcategorias");
    await q("TRUNCATE TABLE categorias");
    await q("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Tablas limpiadas\n");

    // ── PASO 1: Agregar columnas si no existen ─────────────────
    // Usamos try/catch individual porque ALTER TABLE falla si la
    // columna ya existe. Así evitamos que el script se detenga
    // si algunas columnas ya fueron creadas en ejecuciones anteriores.
    const alters = [
      "ALTER TABLE opciones ADD COLUMN precio INT DEFAULT 0",
      "ALTER TABLE opciones ADD COLUMN tipo VARCHAR(20) DEFAULT 'acompanamiento'",
      "ALTER TABLE productos ADD COLUMN tiene_termino TINYINT(1) DEFAULT 0",
      "ALTER TABLE productos ADD COLUMN descripcion TEXT",
      "ALTER TABLE productos ADD COLUMN imagen VARCHAR(100)",
      "ALTER TABLE productos ADD COLUMN categoria_id INT",
      "ALTER TABLE productos ADD COLUMN subcategoria_id INT",
    ];
    for (const sql of alters) {
      try { await q(sql); } catch (_) {} // Ignoramos error si ya existe
    }

    // También creamos la tabla de quejas si no existe aún
    await q(`CREATE TABLE IF NOT EXISTS quejas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mesa VARCHAR(30) DEFAULT 'Sin mesa',
      mensaje TEXT NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente',
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("✅ Estructura lista\n");


    // ── PASO 2: Insertar categorías ────────────────────────────
    // Creamos cada categoría y guardamos su ID en el objeto `catIds`
    // para poder referenciarlo al insertar los productos.
    const categorias = [
      "Platos fuertes","Entradas","Platos típicos","Bar",
      "Pastas","Cortes","Sushi","Comida Vegana","Quesos",
    ];
    const catIds = {}; // Mapa: nombre de categoría → ID en la BD
    for (const nombre of categorias) {
      const r = await q("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
      catIds[nombre] = r.insertId;
      console.log(`📁 ${nombre} → id ${r.insertId}`);
    }
    console.log();


    // ── PASO 3: Insertar subcategorías del Bar ─────────────────
    // El Bar tiene subcategorías (Licores, Cervezas, etc.) que se
    // asocian a la categoría "Bar" mediante su categoria_id.
    const barSubs = ["Licores","Cervezas","Jugos","Micheladas","Gaseosas","Malteadas"];
    const subIds = {}; // Mapa: nombre de subcategoría → ID en la BD
    for (const nombre of barSubs) {
      const r = await q("INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)", [nombre, catIds["Bar"]]);
      subIds[nombre] = r.insertId;
      console.log(`🍹 Bar > ${nombre} → id ${r.insertId}`);
    }
    console.log();


    // ── PASO 4: Insertar opciones (acompañamientos y adiciones) ─
    // Las opciones son compartidas entre productos. Se guardan una sola vez
    // y luego se relacionan con los productos en la tabla `productos_opciones`.
    //
    // Tipos:
    //   - "acompanamiento": opciones de guarnición (papas, arroz, etc.)
    //   - "adiccion": extras con costo adicional (queso extra, aguacate, etc.)
    const opciones = [
      // ── Acompañamientos (precio siempre 0, incluidos en el plato) ──
      { nombre:"Papas a la francesa",    tipo:"acompanamiento", precio:0     },
      { nombre:"Papas al vapor",         tipo:"acompanamiento", precio:0     },
      { nombre:"Ensalada verde",         tipo:"acompanamiento", precio:0     },
      { nombre:"Papas al romero",        tipo:"acompanamiento", precio:0     },
      { nombre:"Puré de papa",           tipo:"acompanamiento", precio:0     },
      { nombre:"Ensalada mixta",         tipo:"acompanamiento", precio:0     },
      { nombre:"Arroz integral",         tipo:"acompanamiento", precio:0     },
      { nombre:"Arroz con ensalada",     tipo:"acompanamiento", precio:0     },
      { nombre:"Con arroz",              tipo:"acompanamiento", precio:0     },
      { nombre:"Con yuca",               tipo:"acompanamiento", precio:0     },
      { nombre:"Con arepa",              tipo:"acompanamiento", precio:0     },
      { nombre:"Con papa",               tipo:"acompanamiento", precio:0     },
      { nombre:"Spaghetti",              tipo:"acompanamiento", precio:0     },
      { nombre:"Fettuccine",             tipo:"acompanamiento", precio:0     },
      { nombre:"Penne",                  tipo:"acompanamiento", precio:0     },
      { nombre:"Linguine",               tipo:"acompanamiento", precio:0     },
      { nombre:"Con aguacate",           tipo:"acompanamiento", precio:0     },
      { nombre:"Sin aguacate",           tipo:"acompanamiento", precio:0     },
      { nombre:"Papas al horno",         tipo:"acompanamiento", precio:0     },
      { nombre:"Ensalada de kale",       tipo:"acompanamiento", precio:0     },
      { nombre:"Dulces",                 tipo:"acompanamiento", precio:0     },
      { nombre:"Saladas",                tipo:"acompanamiento", precio:0     },
      { nombre:"De carne",               tipo:"acompanamiento", precio:0     },
      { nombre:"De pollo",               tipo:"acompanamiento", precio:0     },
      { nombre:"De pipián",              tipo:"acompanamiento", precio:0     },
      { nombre:"Con azúcar",             tipo:"acompanamiento", precio:0     },
      { nombre:"Sin azúcar",             tipo:"acompanamiento", precio:0     },
      { nombre:"Con leche",              tipo:"acompanamiento", precio:0     },
      { nombre:"Con hielo",              tipo:"acompanamiento", precio:0     },
      { nombre:"Sin hielo",              tipo:"acompanamiento", precio:0     },
      // Sabores de licor (algunos tienen precio diferencial)
      { nombre:"Azul",                   tipo:"acompanamiento", precio:0     },
      { nombre:"Verde",                  tipo:"acompanamiento", precio:5000  },
      { nombre:"Amarillo",               tipo:"acompanamiento", precio:5000  },
      // Sabores de bebidas del bar
      { nombre:"Manzana Verde",          tipo:"acompanamiento", precio:0     },
      { nombre:"Cereza",                 tipo:"acompanamiento", precio:0     },
      { nombre:"Macuraya",               tipo:"acompanamiento", precio:0     },
      { nombre:"Mango",                  tipo:"acompanamiento", precio:0     },
      { nombre:"Mora",                   tipo:"acompanamiento", precio:0     },
      { nombre:"Naranja",                tipo:"acompanamiento", precio:0     },
      { nombre:"Mandarina",              tipo:"acompanamiento", precio:0     },
      { nombre:"Fresa",                  tipo:"acompanamiento", precio:0     },
      { nombre:"Aguila original",        tipo:"acompanamiento", precio:0     },
      { nombre:"Aguila Light",           tipo:"acompanamiento", precio:0     },
      { nombre:"Colombiana",             tipo:"acompanamiento", precio:0     },
      { nombre:"uva",                    tipo:"acompanamiento", precio:0     },
      { nombre:"Petsi",                  tipo:"acompanamiento", precio:0     },
      { nombre:"Coca Cola",              tipo:"acompanamiento", precio:0     },
      { nombre:"Fanta",                  tipo:"acompanamiento", precio:0     },
      { nombre:"Sprite",                 tipo:"acompanamiento", precio:0     },
      // ── Adiciones (tienen precio extra) ──────────────────────
      { nombre:"Queso extra",            tipo:"adiccion",       precio:3000  },
      { nombre:"Tocineta",               tipo:"adiccion",       precio:5000  },
      { nombre:"Aguacate extra",         tipo:"adiccion",       precio:4000  },
      { nombre:"Salsa especial",         tipo:"adiccion",       precio:2000  },
      { nombre:"Salsa extra",            tipo:"adiccion",       precio:2000  },
      { nombre:"Queso fundido",          tipo:"adiccion",       precio:4000  },
      { nombre:"Queso rallado",          tipo:"adiccion",       precio:2000  },
      { nombre:"Mazorca adicional",      tipo:"adiccion",       precio:5000  },
      { nombre:"Chorizo extra",          tipo:"adiccion",       precio:6000  },
      { nombre:"Extra queso parmesano",  tipo:"adiccion",       precio:3000  },
      { nombre:"Tocineta extra",         tipo:"adiccion",       precio:4000  },
      { nombre:"Pollo grillado",         tipo:"adiccion",       precio:8000  },
      { nombre:"Camarones",              tipo:"adiccion",       precio:12000 },
      { nombre:"Salsa chimichurri",      tipo:"adiccion",       precio:4000  },
      { nombre:"Salsa de pimienta",      tipo:"adiccion",       precio:4000  },
      { nombre:"Hongos salteados",       tipo:"adiccion",       precio:6000  },
      { nombre:"Queso azul",             tipo:"adiccion",       precio:5000  },
      { nombre:"Cebolla caramelizada",   tipo:"adiccion",       precio:3000  },
      { nombre:"Salsa spicy",            tipo:"adiccion",       precio:2000  },
      { nombre:"Tobiko extra",           tipo:"adiccion",       precio:3000  },
      { nombre:"Salsa de soya extra",    tipo:"adiccion",       precio:1000  },
      { nombre:"Jengibre extra",         tipo:"adiccion",       precio:1500  },
      { nombre:"Tofu marinado",          tipo:"adiccion",       precio:5000  },
      { nombre:"Semillas de chia",       tipo:"adiccion",       precio:2000  },
      { nombre:"Queso vegano",           tipo:"adiccion",       precio:4000  },
      { nombre:"Vino de la casa (copa)", tipo:"adiccion",       precio:18000 },
      { nombre:"Pan baguette extra",     tipo:"adiccion",       precio:5000  },
      { nombre:"Miel de trufa",          tipo:"adiccion",       precio:6000  },
      { nombre:"Papas baby asadas",      tipo:"adiccion",       precio:6000  },
      { nombre:"Manzana en rodajas",     tipo:"adiccion",       precio:3000  },
      { nombre:"Chicharrón",             tipo:"adiccion",       precio:5000  },
      { nombre:"Aguacate",               tipo:"adiccion",       precio:3000  },
      { nombre:"Ají picante",            tipo:"adiccion",       precio:1000  },
      { nombre:"Limón extra",            tipo:"adiccion",       precio:500   },
      { nombre:"Arepa extra",            tipo:"adiccion",       precio:2000  },
      { nombre:"Presa extra",            tipo:"adiccion",       precio:6000  },
      { nombre:"Arroz extra",            tipo:"adiccion",       precio:2000  },
      { nombre:"Chicharrón extra",       tipo:"adiccion",       precio:5000  },
      { nombre:"Pan tostado",            tipo:"adiccion",       precio:3000  },
      { nombre:"Arroz de coco",          tipo:"adiccion",       precio:4000  },
      { nombre:"Extra parmesano",        tipo:"adiccion",       precio:3000  },
      { nombre:"Salsa BBQ",              tipo:"adiccion",       precio:1500  },
      { nombre:"Salsa rosada",           tipo:"adiccion",       precio:1500  },
      { nombre:"Mantequilla extra",      tipo:"adiccion",       precio:1000  },
      { nombre:"Ají extra",              tipo:"adiccion",       precio:500   },
      { nombre:"Pan artesanal",          tipo:"adiccion",       precio:3000  },
      { nombre:"Cereza extra",           tipo:"adiccion",       precio:500   },
    ];

    // Insertamos todas las opciones y guardamos sus IDs en `opIds`
    const opIds = {}; // Mapa: nombre de opción → ID en la BD
    for (const op of opciones) {
      const r = await q(
        "INSERT INTO opciones (nombre, tipo, precio) VALUES (?, ?, ?)",
        [op.nombre, op.tipo, op.precio]
      );
      opIds[op.nombre] = r.insertId;
    }
    console.log(`✅ ${opciones.length} opciones insertadas\n`);


    // ── PASO 5: Función helper para insertar productos ─────────
    // Esta función centraliza la lógica de inserción de un producto
    // y la creación de sus relaciones con las opciones (tabla N:M).
    //
    // Parámetros del objeto `prod`:
    //   - nombre, descripcion, precio, imagen: datos básicos
    //   - tiene_termino: boolean para cortes de carne
    //   - categoria_id: ID de la categoría a la que pertenece
    //   - subcategoria_id: (opcional) solo para productos del Bar
    //   - acomp: array de nombres de acompañamientos (opciones tipo acompanamiento)
    //   - adic: array de nombres de adiciones (opciones tipo adiccion)
    async function ins(prod) {
      const r = await q(
        `INSERT INTO productos (nombre,descripcion,precio,imagen,tiene_termino,categoria_id,subcategoria_id)
         VALUES (?,?,?,?,?,?,?)`,
        [prod.nombre, prod.descripcion, prod.precio, prod.imagen||null,
         prod.tiene_termino?1:0, prod.categoria_id, prod.subcategoria_id||null]
      );
      const pid = r.insertId; // ID del producto recién creado

      // Relacionamos el producto con cada opción usando la tabla productos_opciones
      // Combinamos acompañamientos y adiciones en un solo loop
      for (const n of [...(prod.acomp||[]),...(prod.adic||[])]) {
        if (opIds[n]) {
          await q("INSERT INTO productos_opciones(producto_id,opcion_id)VALUES(?,?)",[pid,opIds[n]]);
        } else {
          // Si el nombre no existe en opIds, algo está mal en los datos
          console.warn(`  ⚠️  Opción no encontrada: "${n}"`);
        }
      }
      console.log(`  ✅ ${prod.nombre}`);
      return pid;
    }


    // ── PASOS 6-14: Insertar todos los productos por categoría ──
    // Usamos la función `ins()` para cada producto, pasando:
    //   - nombre, descripcion, precio, imagen: datos del producto
    //   - categoria_id: tomado del mapa catIds
    //   - subcategoria_id: solo para Bar, tomado del mapa subIds
    //   - acomp: nombres de acompañamientos (deben existir en opIds)
    //   - adic: nombres de adiciones (deben existir en opIds)

    // ── PLATOS FUERTES ──────────────────────────────────────────
    console.log("📂 Platos fuertes");
    await ins({
      nombre:"Hamburguesa Especial", imagen:"hamburguesa", precio:28000,
      descripcion:"Carne de res a la parrilla, pan artesanal, queso, lechuga y tomate.",
      tiene_termino:false, categoria_id:catIds["Platos fuertes"],
      acomp:["Papas a la francesa","Papas al vapor","Ensalada verde"],
      adic:["Queso extra","Tocineta","Aguacate extra","Salsa especial"],
    });
    await ins({
      nombre:"Alitas BBQ", imagen:"alitas", precio:32000,
      descripcion:"Alitas crocantes bañadas en salsa BBQ ahumada. Con dip de queso azul.",
      tiene_termino:false, categoria_id:catIds["Platos fuertes"],
      acomp:["Papas a la francesa","Papas al vapor"],
      adic:["Salsa extra","Queso fundido"],
    });
    await ins({
      nombre:"Pechuga a la Plancha", imagen:"pechuga", precio:26000,
      descripcion:"Pechuga jugosa marinada a la plancha con especias, servida con guarnición.",
      tiene_termino:false, categoria_id:catIds["Platos fuertes"],
      acomp:["Arroz con ensalada","Papas al vapor"],
      adic:["Salsa especial","Aguacate extra"],
    });
    await ins({
      nombre:"Sudado de Pollo", imagen:"sudado", precio:24000,
      descripcion:"Pollo tierno en salsa criolla con papa, yuca y arroz blanco.",
      tiene_termino:false, categoria_id:catIds["Platos fuertes"],
      acomp:["Con arroz","Con yuca"],
      adic:["Chicharrón","Aguacate"],
    });
    await ins({
      nombre:"Chicharrón", imagen:"chicharron", precio:22000,
      descripcion:"Chicharrón crocante de cerdo, acompañado con arepa y limón.",
      tiene_termino:false, categoria_id:catIds["Platos fuertes"],
      acomp:["Con arepa","Con papa"],
      adic:["Ají picante","Limón extra"],
    });

    // ── ENTRADAS ────────────────────────────────────────────────
    console.log("\n📂 Entradas");
    await ins({
      nombre:"Patacones con Guacamole", imagen:"patacon", precio:18000,
      descripcion:"Patacones crocantes con guacamole fresco, tomate y cilantro.",
      tiene_termino:false, categoria_id:catIds["Entradas"],
      acomp:[], adic:["Queso rallado"],
    });
    await ins({
      nombre:"Crispetas", imagen:"crispetas", precio:8000,
      descripcion:"Crispetas de maíz dulces o saladas, perfectas para compartir.",
      tiene_termino:false, categoria_id:catIds["Entradas"],
      acomp:["Dulces","Saladas"], adic:["Mantequilla extra"],
    });
    await ins({
      nombre:"Deditos de Queso", imagen:"deditos", precio:16000,
      descripcion:"Deditos crocantes rellenos de queso fundido. Imposible comer solo uno.",
      tiene_termino:false, categoria_id:catIds["Entradas"],
      acomp:[], adic:["Salsa BBQ","Salsa rosada"],
    });
    await ins({
      nombre:"Empanadas", imagen:"empanadas", precio:12000,
      descripcion:"Empanadas de pipián, carne o pollo. Crujientes por fuera, jugosas por dentro.",
      tiene_termino:false, categoria_id:catIds["Entradas"],
      acomp:["De carne","De pollo","De pipián"], adic:["Ají extra"],
    });
    await ins({
      nombre:"Carpaccio", imagen:"carpaccio", precio:28000,
      descripcion:"Finas láminas de res con rúcula, alcaparras, parmesano y aceite de oliva.",
      tiene_termino:false, categoria_id:catIds["Entradas"],
      acomp:[], adic:["Extra parmesano"],
    });

    // ── PLATOS TÍPICOS ──────────────────────────────────────────
    console.log("\n📂 Platos típicos");
    await ins({
      nombre:"Bandeja Paisa", imagen:"bandeja", precio:36000,
      descripcion:"Frijoles, arroz, carne molida, chicharrón, chorizo, huevo frito, arepa y aguacate.",
      tiene_termino:false, categoria_id:catIds["Platos típicos"],
      acomp:[], adic:["Mazorca adicional","Chorizo extra"],
    });
    await ins({
      nombre:"Mondongo", imagen:"mondongo", precio:28000,
      descripcion:"Sopa tradicional de mondongo con papa, zanahoria, maíz y hierbas aromáticas.",
      tiene_termino:false, categoria_id:catIds["Platos típicos"],
      acomp:[], adic:["Arepa extra","Limón extra"],
    });
    await ins({
      nombre:"Sancocho", imagen:"sancocho", precio:32000,
      descripcion:"Sancocho trifásico con pollo, res y cerdo, papa, yuca, plátano y mazorca.",
      tiene_termino:false, categoria_id:catIds["Platos típicos"],
      acomp:[], adic:["Presa extra","Arroz extra"],
    });
    await ins({
      nombre:"Frijoles Antioqueños", imagen:"frijoles", precio:22000,
      descripcion:"Frijoles cargamanto con hogao, chicharrón y todo el sabor de Antioquia.",
      tiene_termino:false, categoria_id:catIds["Platos típicos"],
      acomp:["Con arroz","Con arepa"], adic:["Chicharrón extra","Aguacate"],
    });
    await ins({
      nombre:"Cazuela de Mariscos", imagen:"cazuela", precio:42000,
      descripcion:"Cazuela cremosa con camarones, calamares y mejillones en salsa de coco.",
      tiene_termino:false, categoria_id:catIds["Platos típicos"],
      acomp:[], adic:["Pan tostado","Arroz de coco"],
    });

    // ── PASTAS ──────────────────────────────────────────────────
    console.log("\n📂 Pastas");
    await ins({
      nombre:"Carbonara Clásica", imagen:"carbonara", precio:30000,
      descripcion:"Spaghetti con salsa de huevo, queso pecorino, guanciale crujiente y pimienta negra.",
      tiene_termino:false, categoria_id:catIds["Pastas"],
      acomp:["Spaghetti","Fettuccine","Penne"],
      adic:["Extra queso parmesano","Tocineta extra"],
    });
    await ins({
      nombre:"Pasta al Pesto", imagen:"pesto", precio:27000,
      descripcion:"Linguine al dente con pesto de albahaca fresca, piñones tostados y parmesano.",
      tiene_termino:false, categoria_id:catIds["Pastas"],
      acomp:["Linguine","Fettuccine"], adic:["Pollo grillado","Camarones"],
    });
    await ins({
      nombre:"Lasaña de Carne", imagen:"lasaña", precio:32000,
      descripcion:"Lasaña tradicional con carne de res, salsa bechamel y queso gratinado.",
      tiene_termino:false, categoria_id:catIds["Pastas"],
      acomp:[], adic:["Queso extra","Salsa extra"],
    });

    // ── CORTES ──────────────────────────────────────────────────
    // Nota: tiene_termino:true activa el selector de cocción en el modal
    console.log("\n📂 Cortes");
    await ins({
      nombre:"Punta de Anca", imagen:"puntaDeAnca", precio:58000,
      descripcion:"Corte de res premium, jugoso y tierno. Cocinado a la parrilla de carbón.",
      tiene_termino:true, categoria_id:catIds["Cortes"],
      acomp:["Papas al romero","Puré de papa","Ensalada mixta"],
      adic:["Salsa chimichurri","Salsa de pimienta"],
    });
    await ins({
      nombre:"Solomito", imagen:"solomito", precio:62000,
      descripcion:"Solomito de res tierno con mantequilla de hierbas y sal marina gruesa.",
      tiene_termino:true, categoria_id:catIds["Cortes"],
      acomp:["Papas al romero","Arroz integral"],
      adic:["Hongos salteados","Cebolla caramelizada"],
    });
    await ins({
      nombre:"Ribeye 300g", imagen:"ribeye", precio:75000,
      descripcion:"Ribeye madurado en seco, 300g. Marmoleo perfecto, sabor inigualable.",
      tiene_termino:true, categoria_id:catIds["Cortes"],
      acomp:["Papas al romero","Puré de papa"],
      adic:["Queso azul","Salsa chimichurri"],
    });

    // ── SUSHI ───────────────────────────────────────────────────
    console.log("\n📂 Sushi");
    await ins({
      nombre:"Roll California", imagen:"california", precio:26000,
      descripcion:"Arroz de sushi, cangrejo, aguacate, pepino, tobiko. 8 piezas.",
      tiene_termino:false, categoria_id:catIds["Sushi"],
      acomp:[], adic:["Salsa spicy","Tobiko extra"],
    });
    await ins({
      nombre:"Roll Spicy Tuna", imagen:"spicytuna", precio:32000,
      descripcion:"Atún fresco con mayonesa spicy, aguacate y cebollín. 8 piezas.",
      tiene_termino:false, categoria_id:catIds["Sushi"],
      acomp:[], adic:["Salsa de soya extra","Jengibre extra"],
    });
    await ins({
      nombre:"Burrito Roll", imagen:"burrito", precio:29000,
      descripcion:"Roll estilo burrito con arroz de sushi, pollo, aguacate y queso crema.",
      tiene_termino:false, categoria_id:catIds["Sushi"],
      acomp:[], adic:["Salsa spicy","Queso extra"],
    });

    // ── COMIDA VEGANA ───────────────────────────────────────────
    console.log("\n📂 Comida Vegana");
    await ins({
      nombre:"Bowl de Quinoa", imagen:"quinoa", precio:24000,
      descripcion:"Quinoa tricolor, garbanzos al horno, kale, tomates cherry y tahini de limón.",
      tiene_termino:false, categoria_id:catIds["Comida Vegana"],
      acomp:["Con aguacate","Sin aguacate"],
      adic:["Tofu marinado","Semillas de chia"],
    });
    await ins({
      nombre:"Burger Vegana", imagen:"burgerVeg", precio:26000,
      descripcion:"Pan artesanal, medallón de lentejas y betabel, lechuga, tomate y mayonesa vegana.",
      tiene_termino:false, categoria_id:catIds["Comida Vegana"],
      acomp:["Papas al horno","Ensalada de kale"],
      adic:["Queso vegano","Aguacate extra"],
    });
    await ins({
      nombre:"Cazuela Vegana", imagen:"cazuela", precio:22000,
      descripcion:"Cazuela cremosa de verduras, garbanzos y leche de coco con hierbas frescas.",
      tiene_termino:false, categoria_id:catIds["Comida Vegana"],
      acomp:[], adic:["Pan artesanal","Arroz integral"],
    });

    // ── QUESOS ──────────────────────────────────────────────────
    console.log("\n📂 Quesos");
    await ins({
      nombre:"Tabla de Quesos Premium", imagen:"tablaQuesos", precio:45000,
      descripcion:"Selección de 4 quesos: brie, gouda añejo, manchego y azul. Con mermelada y frutos secos.",
      tiene_termino:false, categoria_id:catIds["Quesos"],
      acomp:[], adic:["Vino de la casa (copa)","Pan baguette extra","Miel de trufa"],
    });
    await ins({
      nombre:"Fondue de Queso", imagen:"fondue", precio:38000,
      descripcion:"Fondue cremoso de gruyère y emmental con pan rústico, vegetales y charcutería.",
      tiene_termino:false, categoria_id:catIds["Quesos"],
      acomp:[], adic:["Papas baby asadas","Manzana en rodajas"],
    });
    await ins({
      // Nota: el nombre tiene "Quesos" al final para diferenciarlo del
      // "Deditos de Queso" de la categoría Entradas (mismo producto, diferente categoría)
      nombre:"Deditos de Queso Quesos", imagen:"deditos", precio:16000,
      descripcion:"Deditos crocantes rellenos de queso fundido. Perfectos para compartir.",
      tiene_termino:false, categoria_id:catIds["Quesos"],
      acomp:[], adic:["Salsa BBQ","Salsa rosada"],
    });

    // ── BAR ─────────────────────────────────────────────────────
    // Los productos del Bar se insertan igual que los demás pero con
    // `subcategoria_id` para indicar a qué subcategoría pertenecen.

    console.log("\n📂 Bar > Licores");
    await ins({
      nombre:"Aguardiente Antioqueño", imagen:"aguardiente", precio:50000,
      descripcion:"Aguardiente antioqueño botella personal, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Licores"],
      // Las opciones de "sabor" (Azul, Verde, Amarillo) van como acompañamientos
      acomp:["Con hielo","Sin hielo","Azul","Verde","Amarillo"],
      adic:["Limón extra"],
    });
    await ins({
      nombre:"Smirnoff", imagen:"smirnoff", precio:12000,
      descripcion:"Delicioso licor refrescante, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Licores"],
      acomp:["Con hielo","Sin hielo"],
      adic:["Limón extra"],
    });

    console.log("\n📂 Bar > Cervezas");
    await ins({
      nombre:"Aguila", imagen:"aguila", precio:7000,
      descripcion:"Cerveza original, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Cervezas"],
      acomp:["Con hielo","Sin hielo"], adic:["Limón extra"],
    });
    await ins({
      nombre:"Aguila Light", imagen:"aguilaLight", precio:7000,
      descripcion:"Cerveza refrescante, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Cervezas"],
      acomp:["Con hielo","Sin hielo"], adic:["Limón extra"],
    });
    await ins({
      nombre:"Corona", imagen:"corona", precio:12000,
      descripcion:"Cerveza tradicional, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Cervezas"],
      acomp:["Con hielo","Sin hielo"], adic:["Limón extra"],
    });
    await ins({
      nombre:"Cuates", imagen:"cuates", precio:10000,
      descripcion:"Cerveza saborizada, frío.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Cervezas"],
      // Cuates tiene opciones de sabor como acompañamientos
      acomp:["Manzana Verde","Cereza","Macuraya","Con hielo","Sin hielo"],
      adic:["Limón extra"],
    });

    console.log("\n📂 Bar > Jugos");
    await ins({
      nombre:"Jugo Natural", imagen:"jugo", precio:8000,
      descripcion:"Jugo natural de la fruta del día, sin azúcar o con azúcar al gusto.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Jugos"],
      acomp:["Con azúcar","Sin azúcar","Con leche"], adic:[],
    });
    await ins({
      nombre:"Jugo Frutal", imagen:"jugos", precio:9000,
      descripcion:"Jugo natural de la fruta, sin azúcar o con azúcar al gusto.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Jugos"],
      // Muchas opciones de fruta disponibles
      acomp:["Con azúcar","Sin azúcar","Con leche","Mango","Mora","Naranja","Mandarina","Fresa"],
      adic:[],
    });

    console.log("\n📂 Bar > Micheladas");
    await ins({
      nombre:"Michelada", imagen:"michelada", precio:7000,
      descripcion:"Michelada tradicional.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Micheladas"],
      acomp:["Aguila original","Aguila Light"], adic:[],
    });
    await ins({
      nombre:"Michelada Saborizada", imagen:"micheladaSaborizada", precio:7000,
      descripcion:"Michelada saborizada.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Micheladas"],
      acomp:["Mango","Cereza"], adic:[],
    });

    console.log("\n📂 Bar > Gaseosas");
    await ins({
      nombre:"Gaseosas", imagen:"gaseosas", precio:2500,
      descripcion:"Gaseosas Colombianas.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Gaseosas"],
      // Todas las marcas disponibles como opciones de acompañamiento
      acomp:["Colombiana","uva","Petsi","Coca Cola","Fanta","Sprite"], adic:[],
    });

    console.log("\n📂 Bar > Malteadas");
    await ins({
      nombre:"Malteada de chocolate", imagen:"malteadachp", precio:7000,
      descripcion:"Malteada de chocolate con chips de chocolate.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Malteadas"],
      acomp:[], adic:[],
    });

    console.log("\n\n🎉 ¡Seed COMPLETO exitosamente!");

  } catch (err) {
    // Si algo sale mal, mostramos el error completo para facilitar el debug
    console.error("\n❌ Error en seed:", err.message);
    console.error(err);
  } finally {
    // Siempre cerramos la conexión y terminamos el proceso,
    // sin importar si hubo error o no
    conn.end();
    process.exit(0);
  }
}

// ── Punto de entrada del script ───────────────────────────────
// Primero intentamos conectar a la BD.
// Si la conexión falla, mostramos el error y salimos.
// Si la conexión es exitosa, ejecutamos el seed.
conn.connect(err => {
  if (err) { console.error("❌ No se pudo conectar:", err.message); process.exit(1); }
  console.log("✅ Conectado a MySQL\n");
  seed();
});