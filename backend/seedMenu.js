const mysql = require("mysql2");
require("dotenv").config();

const conn = mysql.createConnection({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || process.env.DB_DATABASE || "mesasmart",
  port:     process.env.DB_PORT     || 3306,
});

function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function seed() {
  try {
    console.log("🌱 Iniciando seed COMPLETO de MesaSmart...\n");

    // ── 0. Limpiar todo ─────────────────────────────────────────────────────
    await q("SET FOREIGN_KEY_CHECKS = 0");
    await q("TRUNCATE TABLE productos_opciones");
    await q("TRUNCATE TABLE opciones");
    await q("TRUNCATE TABLE productos");
    await q("TRUNCATE TABLE subcategorias");
    await q("TRUNCATE TABLE categorias");
    await q("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Tablas limpiadas\n");

    // ── 1. Columnas necesarias ──────────────────────────────────────────────
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
      try { await q(sql); } catch (_) {}
    }
    await q(`CREATE TABLE IF NOT EXISTS quejas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mesa VARCHAR(30) DEFAULT 'Sin mesa',
      mensaje TEXT NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente',
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("✅ Estructura lista\n");

    // ── 2. Categorías ───────────────────────────────────────────────────────
    const categorias = [
      "Platos fuertes","Entradas","Platos típicos","Bar",
      "Pastas","Cortes","Sushi","Comida Vegana","Quesos",
    ];
    const catIds = {};
    for (const nombre of categorias) {
      const r = await q("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
      catIds[nombre] = r.insertId;
      console.log(`📁 ${nombre} → id ${r.insertId}`);
    }
    console.log();

    // ── 3. Subcategorías Bar ────────────────────────────────────────────────
    const barSubs = ["Licores","Cervezas","Jugos","Micheladas","Gaseosas","Malteadas"];
    const subIds = {};
    for (const nombre of barSubs) {
      const r = await q("INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)", [nombre, catIds["Bar"]]);
      subIds[nombre] = r.insertId;
      console.log(`🍹 Bar > ${nombre} → id ${r.insertId}`);
    }
    console.log();

    // ── 4. Opciones ─────────────────────────────────────────────────────────
    const opciones = [
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
    ];

    const opIds = {};
    for (const op of opciones) {
      const r = await q(
        "INSERT INTO opciones (nombre, tipo, precio) VALUES (?, ?, ?)",
        [op.nombre, op.tipo, op.precio]
      );
      opIds[op.nombre] = r.insertId;
    }
    console.log(`✅ ${opciones.length} opciones insertadas\n`);

    // ── 5. Helper ───────────────────────────────────────────────────────────
    async function ins(prod) {
      const r = await q(
        `INSERT INTO productos (nombre,descripcion,precio,imagen,tiene_termino,categoria_id,subcategoria_id)
         VALUES (?,?,?,?,?,?,?)`,
        [prod.nombre, prod.descripcion, prod.precio, prod.imagen||null,
         prod.tiene_termino?1:0, prod.categoria_id, prod.subcategoria_id||null]
      );
      const pid = r.insertId;
      for (const n of [...(prod.acomp||[]),...(prod.adic||[])]) {
        if (opIds[n]) await q("INSERT INTO productos_opciones(producto_id,opcion_id)VALUES(?,?)",[pid,opIds[n]]);
        else console.warn(`  ⚠️  Opción no encontrada: "${n}"`);
      }
      console.log(`  ✅ ${prod.nombre}`);
      return pid;
    }

    // ── 6. PLATOS FUERTES ───────────────────────────────────────────────────
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

    // ── 7. ENTRADAS ─────────────────────────────────────────────────────────
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

    // ── 8. PLATOS TÍPICOS ───────────────────────────────────────────────────
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

    // ── 9. PASTAS ───────────────────────────────────────────────────────────
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
      nombre:"Lasaña de Carne", imagen:"carbonara", precio:32000,
      descripcion:"Lasaña tradicional con carne de res, salsa bechamel y queso gratinado.",
      tiene_termino:false, categoria_id:catIds["Pastas"],
      acomp:[], adic:["Queso extra","Salsa extra"],
    });

    // ── 10. CORTES ──────────────────────────────────────────────────────────
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

    // ── 11. SUSHI ───────────────────────────────────────────────────────────
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

    // ── 12. COMIDA VEGANA ───────────────────────────────────────────────────
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

    // ── 13. QUESOS ──────────────────────────────────────────────────────────
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
      nombre:"Deditos de Queso Quesos", imagen:"deditos", precio:16000,
      descripcion:"Deditos crocantes rellenos de queso fundido. Perfectos para compartir.",
      tiene_termino:false, categoria_id:catIds["Quesos"],
      acomp:[], adic:["Salsa BBQ","Salsa rosada"],
    });

    // ── 14. BAR ─────────────────────────────────────────────────────────────
    console.log("\n📂 Bar > Jugos");
    await ins({
      nombre:"Jugo Natural", imagen:"jugo", precio:8000,
      descripcion:"Jugo natural de la fruta del día, sin azúcar o con azúcar al gusto.",
      tiene_termino:false, categoria_id:catIds["Bar"], subcategoria_id:subIds["Jugos"],
      acomp:["Con azúcar","Sin azúcar","Con leche"], adic:[],
    });

    // Ejemplo: agregar Aguardiente a Bar > Licores
console.log("\n📂 Bar > Licores");
await ins({
  nombre:        "Aguardiente Antioqueño",   // nombre del plato
  imagen:        "aguardiente",              // nombre en imagenes.js (sin .jpg)
  precio:        12000,                      // precio en pesos
  descripcion:   "Aguardiente antioqueño botella personal, frío.",
  tiene_termino: false,                      // true SOLO para carnes
  categoria_id:  catIds["Bar"],              // categoría exacta
  subcategoria_id: subIds["Licores"],        // subcategoría (solo Bar la usa)
  acomp: ["Con hielo", "Sin hielo"],         // acompañamientos (precio 0)
  adic:  ["Limón extra"],                    // adiciones (precio > 0)
});

    console.log("\n\n🎉 ¡Seed COMPLETO exitosamente!");
    console.log(`Productos insertados: 30`);

  } catch (err) {
    console.error("\n❌ Error en seed:", err.message);
    console.error(err);
  } finally {
    conn.end();
    process.exit(0);
  }
}

conn.connect(err => {
  if (err) { console.error("❌ No se pudo conectar:", err.message); process.exit(1); }
  console.log("✅ Conectado a MySQL\n");
  seed();
});