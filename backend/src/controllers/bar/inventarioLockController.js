// backend/src/controllers/bar/inventarioLockController.js
const { pool } = require("../../config/db");

const MINUTOS_UNLOCK = 30;

const getLock = async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      "SELECT valor, expira_en, actualizado_por FROM bar_config WHERE clave = 'inventario_editable'"
    );
    if (!row) return res.json({ ok: true, editable: false, segundos_restantes: 0 });

    const ahora    = new Date();
    const expira   = row.expira_en ? new Date(row.expira_en) : null;
    const editable = row.valor === "1" && expira && expira > ahora;

    if (row.valor === "1" && expira && expira <= ahora) {
      await pool.execute(
        "UPDATE bar_config SET valor = '0', expira_en = NULL WHERE clave = 'inventario_editable'"
      );
    }

    const segundos_restantes = editable
      ? Math.max(0, Math.floor((expira - ahora) / 1000))
      : 0;

    res.json({
      ok: true, editable, segundos_restantes,
      expira_en:       editable ? row.expira_en : null,
      actualizado_por: row.actualizado_por,
    });
  } catch (err) {
    console.error("[inventarioLock] getLock:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const encender = async (req, res) => {
  try {
    // ✅ FIX: req.usuario (no req.user)
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo el admin puede activar esto" });
    }
    const expira = new Date(Date.now() + MINUTOS_UNLOCK * 60 * 1000);
    await pool.execute(
      `UPDATE bar_config
       SET valor = '1', expira_en = ?, actualizado_en = NOW(), actualizado_por = ?
       WHERE clave = 'inventario_editable'`,
      [expira, req.usuario?.nombre || req.usuario?.email || "Admin"]
    );
    res.json({
      ok: true,
      mensaje:          `Inventario desbloqueado por ${MINUTOS_UNLOCK} minutos`,
      expira_en:        expira,
      segundos_totales: MINUTOS_UNLOCK * 60,
    });
  } catch (err) {
    console.error("[inventarioLock] encender:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

const apagar = async (req, res) => {
  try {
    // ✅ FIX: req.usuario (no req.user)
    if (req.usuario?.rol !== "admin") {
      return res.status(403).json({ ok: false, error: "Solo el admin puede desactivar esto" });
    }
    await pool.execute(
      `UPDATE bar_config
       SET valor = '0', expira_en = NULL, actualizado_en = NOW(), actualizado_por = ?
       WHERE clave = 'inventario_editable'`,
      [req.usuario?.nombre || req.usuario?.email || "Admin"]
    );
    res.json({ ok: true, mensaje: "Inventario bloqueado" });
  } catch (err) {
    console.error("[inventarioLock] apagar:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = { getLock, encender, apagar, MINUTOS_UNLOCK };