// backend/src/middlewares/authMiddleware.js
const jwt    = require("jsonwebtoken");
const Sesion = require("../models/Sesion");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ msg: "Token requerido." });

    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.jti) {
      const activa = await Sesion.estaActiva(decoded.jti);
      if (!activa)
        return res.status(401).json({ msg: "Sesión expirada. Inicia sesión de nuevo." });
    }
    req.usuario = decoded; // { id, rol, jti }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ msg: "Token expirado." });
    return res.status(401).json({ msg: "Token inválido." });
  }
};