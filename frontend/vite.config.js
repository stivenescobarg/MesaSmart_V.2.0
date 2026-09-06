import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // necesario para que Docker exponga el puerto hacia afuera
    allowedHosts: [
      "cesarean-thrift-afar.ngrok-free.dev", // tu dominio fijo de ngrok
    ],
    proxy: {
      // Cualquier petición a /api se reenvía al contenedor 'backend' por la
      // red interna de Docker (compose resuelve 'backend' automáticamente
      // al nombre del servicio). El navegador nunca ve esta URL, solo ve
      // que le respondieron desde el mismo dominio que cargó la página.
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
})