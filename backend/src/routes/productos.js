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

module.exports = router;