const QRCode = require("qrcode");

// URL del FRONTEND (donde vive la página pública del menú), no la del backend.
// En local:      http://localhost:5173  (o el puerto de tu Vite/CRA)
// En producción: https://mesasmart.app
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function urlMenuMesa(restaurante_id, mesa_id) {
  return `${FRONTEND_URL}/menu/${restaurante_id}/${mesa_id}`;
}

// Para el endpoint GET /:id/qr -> devuelve la imagen como PNG binario
async function generarQRBuffer(restaurante_id, mesa_id) {
  const url = urlMenuMesa(restaurante_id, mesa_id);
  const buffer = await QRCode.toBuffer(url, { type: "png", width: 500, margin: 2 });
  return { url, buffer };
}

// Para devolverlo embebido en el JSON de "crear mesa" (sin pedir otra llamada)
async function generarQRBase64(restaurante_id, mesa_id) {
  const url = urlMenuMesa(restaurante_id, mesa_id);
  const dataUrl = await QRCode.toDataURL(url, { width: 500, margin: 2 });
  return { url, imagen: dataUrl }; // imagen ya viene como "data:image/png;base64,...."
}

module.exports = { generarQRBuffer, generarQRBase64, urlMenuMesa, FRONTEND_URL };