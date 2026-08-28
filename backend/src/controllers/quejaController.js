const { pool } = require("../config/db");

exports.create = async (req, res) => {
  const { mesa, mensaje } = req.body;

  if (!mensaje?.trim()) {
    return res.status(400).json({ error: "Mensaje requerido" });
  }

  try {
    await pool.execute(
      "INSERT INTO quejas (restaurante_id, mesa, mensaje) VALUES (?, ?, ?)",
      [req.restaurante_id, mesa || "Sin mesa", mensaje.trim()]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[quejas/create]", err);
    res.status(500).json({ error: "Error al guardar la queja" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM quejas WHERE restaurante_id = ? ORDER BY fecha DESC",
      [req.restaurante_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("[quejas/getAll]", err);
    res.status(500).json({ error: "Error al obtener quejas" });
  }
};

exports.updateEstado = async (req, res) => {
  const estadosValidos = ["pendiente", "revisada", "resuelta"];
  const { estado } = req.body;

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado invalido" });
  }

  try {
    // Verifica pertenencia antes de actualizar — mismo patrón de siempre
    const [r] = await pool.execute(
      "UPDATE quejas SET estado = ? WHERE id = ? AND restaurante_id = ?",
      [estado, req.params.id, req.restaurante_id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "Queja no encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[quejas/updateEstado]", err);
    res.status(500).json({ error: "Error al actualizar queja" });
  }
};