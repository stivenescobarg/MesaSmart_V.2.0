const r    = require("express").Router();
const { pool } = require("../../config/db");

// GET /api/bar/ordenes — el bartender consulta esto
r.get("/ordenes", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM ordenes_bar WHERE estado='pendiente' ORDER BY creado_en ASC"
    );
    res.json({ ok: true, ordenes: rows });
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener órdenes." });
  }
});

// POST /api/bar/orden — el menú envía bebidas al pagar
r.post("/orden", async (req, res) => {
  try {
    const { mesa, items } = req.body;
    if (!items || items.length === 0)
      return res.json({ ok: true, msg: "Sin bebidas." });
    await pool.execute(
      "INSERT INTO ordenes_bar (mesa, items) VALUES (?, ?)",
      [mesa || "Sin mesa", JSON.stringify(items)]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al crear orden." });
  }
});

// PATCH /api/bar/orden/:id — el bartender marca como listo
r.patch("/orden/:id", async (req, res) => {
  try {
    await pool.execute(
      "UPDATE ordenes_bar SET estado='listo' WHERE id=?",
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al actualizar orden." });
  }
});

module.exports = r;