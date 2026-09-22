const crypto = require("crypto");

const QR_SECRET = process.env.QR_SECRET;
if (!QR_SECRET) {
  throw new Error("QR_SECRET no está definida en las variables de entorno.");
}

function firmar(restaurante_id, mesa_id) {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(`${restaurante_id}.${mesa_id}`)
    .digest("hex");
}

function generarToken(restaurante_id, mesa_id) {
  return firmar(restaurante_id, mesa_id);
}

function verificarToken(restaurante_id, mesa_id, token) {
  if (!token || typeof token !== "string") return false;
  const esperado = firmar(restaurante_id, mesa_id);
  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { generarToken, verificarToken };