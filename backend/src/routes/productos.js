const router = require("express").Router();
const { pool } = require("../config/db");
const publicTenant = require("../middlewares/publicTenantMiddleware");

// TODO (cuando exista login de admin): agregar auth, tenant, role("admin")
// ANTES de publicTenant en POST y PUT — hoy quedan abiertas a propósito
// porque la vista de admin de la compañera todavía no tiene autenticación.
// publicTenant ya resuelve req.restaurante_id igual en ambos casos, así
// que el cambio futuro es solo agregar los 3 middlewares delante, sin
// tocar la lógica interna de los handlers.

router.get(["/categorias", "/:slug/categorias"], publicTenant, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM categorias WHERE restaurante_id = ? ORDER BY nombre",
      [req.restaurante_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("[menu/categorias]", error);
    res.status(500).json({ msg: "No fue posible cargar las categorías." });
  }
});

router.get(["/", "/:slug"], publicTenant, async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT p.*, c.nombre categoria, s.nombre subcategoria
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN subcategorias s ON s.id = p.subcategoria_id
       WHERE p.restaurante_id = ?
       ORDER BY c.id, s.id, p.nombre`,
      [req.restaurante_id]
    );
    res.json(productos.map(producto => ({ ...producto, disponible: true, opciones: [], adiciones: [] })));
  } catch (error) {
    console.error("[menu/listar]", error);
    res.status(500).json({ msg: "No fue posible cargar el menú." });
  }
});

router.post(["/", "/:slug"], publicTenant, async (req, res) => {
  const { nombre, precio, categoria_id, subcategoria_id } = req.body;

  if (!nombre || precio == null || !categoria_id) {
    return res.status(400).json({ msg: "nombre, precio y categoria_id son requeridos." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[cat]] = await conn.execute(
      "SELECT id FROM categorias WHERE id = ? AND restaurante_id = ?",
      [categoria_id, req.restaurante_id]
    );
    if (!cat) {
      await conn.rollback();
      return res.status(404).json({ msg: "Categoría no encontrada." });
    }

    const [result] = await conn.execute(
      "INSERT INTO productos (nombre, precio, categoria_id, subcategoria_id, restaurante_id) VALUES (?, ?, ?, ?, ?)",
      [nombre, precio, categoria_id, subcategoria_id || null, req.restaurante_id]
    );
    await conn.commit();
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (error) {
    await conn.rollback();
    console.error("[menu/crear]", error);
    res.status(500).json({ msg: "No fue posible crear el producto." });
  } finally {
    conn.release();
  }
});

// NUEVO: Menu.jsx ya llama a esto (PUT /api/menu/:id) pero no existía
// ningún archivo que lo implementara — la edición de productos estaba rota.
router.put(["/:id", "/:slug/:id"], publicTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    if (!nombre || precio == null) {
      return res.status(400).json({ msg: "nombre y precio son requeridos." });
    }

    // Verifica pertenencia ANTES de actualizar — evita editar un producto
    // de otro restaurante adivinando su id numérico.
    const [result] = await pool.execute(
      `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, imagen = ?
       WHERE id = ? AND restaurante_id = ?`,
      [nombre, descripcion || null, precio, imagen || null, id, req.restaurante_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Producto no encontrado." });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("[menu/editar]", error);
    res.status(500).json({ msg: "No fue posible actualizar el producto." });
  }
});

module.exports = router;