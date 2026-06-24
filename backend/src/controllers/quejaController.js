const { pool } = require("../config/db");

exports.create = async (req, res) => {
  const { mesa, mensaje } = req.body;

  if (!mensaje?.trim()) {
    return res.status(400).json({ error: "Mensaje requerido" });
  }

  try {
    await pool.execute(
      "INSERT INTO quejas (mesa, mensaje) VALUES (?, ?)",
      [mesa || "Sin mesa", mensaje.trim()]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[quejas/create]", err);
    res.status(500).json({ error: "Error al guardar la queja" });
  }
};

exports.getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM quejas ORDER BY fecha DESC");
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
    await pool.execute(
      "UPDATE quejas SET estado = ? WHERE id = ?",
      [estado, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[quejas/updateEstado]", err);
    res.status(500).json({ error: "Error al actualizar queja" });
  }
};
