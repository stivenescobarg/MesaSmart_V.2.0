// backend/src/routes/upload.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middlewares/authMiddleware");
const role    = require("../middlewares/roleMiddleware");
const upload  = require("../config/multer");

// ────────────────────────────────────────────────────────────
// POST /api/upload/imagen
// Ruta PROTEGIDA (solo admin). Sube una imagen a Cloudinary y
// devuelve la URL. No toca la BD — el frontend guarda esa URL
// en el estado del formulario y la manda junto con el resto del
// producto cuando hace POST/PUT a /api/menu.
// ────────────────────────────────────────────────────────────
router.post("/imagen", auth, role("admin"), upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No se recibió ninguna imagen." });
  }
  res.json({ url: req.file.path, publicId: req.file.filename });
});

module.exports = router;