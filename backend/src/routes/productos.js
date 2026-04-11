const express = require("express");
const router  = express.Router();
const { pool } = require("../config/db");

// GET /api/menu
router.get("/", async (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.nombre,
      p.descripcion,
      p.precio,
      p.imagen,
      p.tiene_termino,
      c.nombre AS categoria,
      s.nombre AS subcategoria,
      o.id     AS opcion_id,
      o.nombre AS opcion_nombre,
      o.tipo,
      o.precio AS opcion_precio
    FROM productos p
    LEFT JOIN categorias        c  ON p.categoria_id    = c.id
    LEFT JOIN subcategorias     s  ON p.subcategoria_id = s.id
    LEFT JOIN productos_opciones po ON p.id             = po.producto_id
    LEFT JOIN opciones          o  ON po.opcion_id      = o.id
    ORDER BY p.id;
  `;

  try {
    const [results] = await pool.query(sql);

    const productosMap = {};

    results.forEach(row => {
      if (!productosMap[row.id]) {
        productosMap[row.id] = {
          nombre:        row.nombre,
          descripcion:   row.descripcion,
          precio:        row.precio,
          imagen:        row.imagen,
          tiene_termino: row.tiene_termino,
          categoria:     row.categoria,
          subcategoria:  row.subcategoria,
          opciones:      [],
          adiciones:     [],
        };
      }

      if (row.opcion_id) {
        const opcion = { nombre: row.opcion_nombre, precio: row.opcion_precio };
        if (row.tipo === "acompanamiento") {
          productosMap[row.id].opciones.push(opcion);
        } else {
          productosMap[row.id].adiciones.push(opcion);
        }
      }
    });

    res.json(Object.values(productosMap));
  } catch (err) {
    console.error("❌ Error SQL:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// POST /api/menu — agregar nuevo producto
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { nombre, descripcion, precio, categoria_id, imagen, tiene_termino, adiciones } = req.body;

    if (!nombre || !precio || !categoria_id)
      return res.status(400).json({ error: "Nombre, precio y categoría son requeridos" });

    const [result] = await conn.execute(
      `INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen, tiene_termino)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || "", precio, categoria_id, imagen || null, tiene_termino ? 1 : 0]
    );
    const productoId = result.insertId;

    if (adiciones?.length > 0) {
      for (const ad of adiciones) {
        const [opResult] = await conn.execute(
          `INSERT INTO opciones (nombre, precio, tipo) VALUES (?, ?, 'adicion')`,
          [ad.nombre, ad.precio || 0]
        );
        await conn.execute(
          `INSERT INTO productos_opciones (producto_id, opcion_id) VALUES (?, ?)`,
          [productoId, opResult.insertId]
        );
      }
    }

    await conn.commit();
    res.json({ ok: true, id: productoId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error al guardar producto:", err);
    res.status(500).json({ error: "Error al guardar producto" });
  } finally {
    conn.release();
  }
});

// GET /api/menu/categorias — lista de categorías
router.get("/categorias", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM categorias ORDER BY nombre");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// PUT /api/menu/:id — editar producto
router.put("/:id", async (req, res) => {
  try {
    const { nombre, descripcion, precio, imagen } = req.body;
    await pool.execute(
      `UPDATE productos SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id=?`,
      [nombre, descripcion || "", precio, imagen || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al editar producto:", err);
    res.status(500).json({ error: "Error al editar producto" });
  }
});

module.exports = router;