// backend/src/routes/productos.js
//
// Estructura real confirmada en DBeaver:
//   productos:  id, restaurante_id, nombre, descripcion, precio,
//               imagen, tiene_termino, subcategoria, categoria_id, ...
//   opciones:   id, nombre, producto_id, precio, tipo (default 'adiccion')
//   (la tabla productos_opciones YA NO SE USA — opciones tiene su propio
//    producto_id, así que la relación es directa)

const express = require("express");
const router  = express.Router();
const { pool } = require("../config/db");
const auth    = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// ────────────────────────────────────────────────────────────
// GET /api/menu/:restauranteId
// Ruta PÚBLICA (sin login) — la usa el cliente que escaneó el QR.
// Devuelve todos los productos de ESE restaurante, con sus
// categorías, subcategorías, opciones y adiciones.
// ────────────────────────────────────────────────────────────
router.get("/:restauranteId", async (req, res) => {
  const { restauranteId } = req.params;
  try {
    const [productos] = await pool.query(
      `SELECT
         p.id, p.nombre, p.descripcion, p.precio, p.imagen,
         p.tiene_termino, p.subcategoria,
         c.nombre AS categoria
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
       WHERE p.restaurante_id = ?
       ORDER BY c.nombre, p.nombre`,
      [restauranteId]
    );

    // Para cada producto, traemos sus opciones y adiciones directamente
    // desde la tabla "opciones" (que ya tiene su propio producto_id),
    // filtrando por la columna "tipo".
    for (const prod of productos) {
      const [opciones] = await pool.query(
        `SELECT nombre, precio
         FROM opciones
         WHERE producto_id = ? AND tipo = 'opcion'`,
        [prod.id]
      );
      const [adiciones] = await pool.query(
        `SELECT nombre, precio
         FROM opciones
         WHERE producto_id = ? AND tipo = 'adiccion'`,
        [prod.id]
      );
      prod.opciones  = opciones;
      prod.adiciones = adiciones;
    }

    res.json(productos);
  } catch (err) {
    console.error("[GET /api/menu/:restauranteId]", err);
    res.status(500).json({ msg: "Error al cargar el menú." });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/menu/:restauranteId/categorias
// Pública también — se usa para llenar el <select> del modal
// "Agregar producto".
// ────────────────────────────────────────────────────────────
router.get("/:restauranteId/categorias", async (req, res) => {
  const { restauranteId } = req.params;
  try {
    const [categorias] = await pool.query(
      // Si tus categorías son globales (no por restaurante), quita
      // el WHERE. Si cada restaurante tiene las suyas, esto ya filtra bien.
      `SELECT id, nombre FROM categorias
       WHERE restaurante_id = ? OR restaurante_id IS NULL
       ORDER BY nombre`,
      [restauranteId]
    );
    res.json(categorias);
  } catch (err) {
    console.error("[GET /api/menu/:restauranteId/categorias]", err);
    res.status(500).json({ msg: "Error al cargar categorías." });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/menu
// Ruta PROTEGIDA (requiere login admin). El restaurante_id NUNCA
// se toma del body — siempre del token, así nadie puede crear
// productos para un restaurante que no es el suyo.
// ────────────────────────────────────────────────────────────

router.post("/", auth, role("admin"), async (req, res) => { // 👈 + role("admin")
  try {
    const { nombre, descripcion, precio, categoria_id, imagen, tiene_termino, subcategoria, adiciones } = req.body;
    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({ msg: "Nombre, precio y categoría son obligatorios." });
    }

    const restauranteId = req.usuario.restaurante_id;

      const [[categoria]] = await pool.query(
      `SELECT id FROM categorias WHERE id = ? AND restaurante_id = ?`,
      [categoria_id, restauranteId]
    );
    if (!categoria) {
      return res.status(400).json({ msg: "La categoría seleccionada no pertenece a tu restaurante." });
    }

    const [result] = await pool.query(
      `INSERT INTO productos
         (restaurante_id, nombre, descripcion, precio, categoria_id, imagen, tiene_termino, subcategoria)
       VALUES (?,?,?,?,?,?,?,?)`,
      [restauranteId, nombre, descripcion || null, precio, categoria_id, imagen || null, !!tiene_termino, subcategoria || null]
    );

    const productoId = result.insertId;

    // Guardamos las adiciones si el formulario mandó alguna.
    // opciones ya tiene su propio producto_id, así que el INSERT es directo
    // (ya no se usa la tabla productos_opciones).
    if (Array.isArray(adiciones) && adiciones.length > 0) {
      for (const ad of adiciones) {
        await pool.query(
          `INSERT INTO opciones (nombre, precio, producto_id, tipo) VALUES (?,?,?,?)`,
          [ad.nombre, ad.precio || 0, productoId, "adiccion"]
        );
      }
    }

    res.json({ ok: true, id: productoId });
  } catch (err) {
    console.error("[POST /api/menu]", err);
    res.status(500).json({ msg: "Error al crear el producto." });
  }
});

// ────────────────────────────────────────────────────────────
// PUT /api/menu/:id
// Ruta PROTEGIDA. Antes de editar, verificamos que el producto
// pertenezca al restaurante del usuario logueado — si no, nadie
// (ni con el ID adivinado) puede editar productos ajenos.
// ────────────────────────────────────────────────────────────
router.put("/:id", auth, role("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const restauranteId = req.usuario.restaurante_id;

    const [[producto]] = await pool.query(
      `SELECT id FROM productos WHERE id = ? AND restaurante_id = ?`,
      [id, restauranteId]
    );
    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado en tu restaurante." });
    }

    const { nombre, descripcion, precio, imagen } = req.body;
    await pool.query(
      `UPDATE productos SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id=? AND restaurante_id=?`,
      [nombre, descripcion || null, precio, imagen || null, id, restauranteId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/menu/:id]", err);
    res.status(500).json({ msg: "Error al actualizar el producto." });
  }
});

module.exports = router;