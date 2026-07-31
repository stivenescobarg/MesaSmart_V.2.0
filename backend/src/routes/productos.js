// backend/src/routes/productos.js
const router = require("express").Router();
const { pool } = require("../config/db");
 
router.get("/", async (_req, res) => {
  try {
    const [productos] = await pool.query(`SELECT p.*, c.nombre categoria, s.nombre subcategoria FROM productos p LEFT JOIN categorias c ON c.id=p.categoria_id LEFT JOIN subcategorias s ON s.id=p.subcategoria_id ORDER BY c.id,s.id,p.nombre`);
    res.json(productos.map(producto => ({ ...producto, disponible: true, opciones: [], adiciones: [] })));
  } catch (error) { console.error("[menu/listar]", error); res.status(500).json({ msg: "No fue posible cargar el menú." }); }
});
router.get("/categorias", async (_req,res) => { const [rows] = await pool.query("SELECT * FROM categorias ORDER BY nombre"); res.json(rows); });
router.post("/", async (req, res) => {
  const { nombre, precio, categoria_id, subcategoria_id } = req.body;
 
  if (!nombre || precio == null || !categoria_id) {
    return res.status(400).json({ msg: "nombre, precio y categoria_id son requeridos." });
  }
 
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      "INSERT INTO productos (nombre, precio, categoria_id, subcategoria_id) VALUES (?, ?, ?, ?)",
      [nombre, precio, categoria_id, subcategoria_id || null]
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
module.exports = router;
 