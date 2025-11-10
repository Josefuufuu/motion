// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import history from 'connect-history-api-fallback';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Asegura compatibilidad con librerías que usan el antiguo runtime de JSX
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }),
    tailwindcss()
  ],
  server: {
    // Permite acceso desde cualquier host (útil para redes locales y Docker)
    host: true,
    // Puerto donde corre Vite (por defecto 5173)
    port: 5173,
    middlewareMode: false,
    // Redirección de llamadas /api al backend (Django, Node, etc.)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Necesario para manejar rutas de React Router en producción
  configureServer(server) {
    server.middlewares.use(
      history({
        index: '/index.html', // Cualquier 404 redirige al frontend
      })
    );
  },
  resolve: {
    alias: {
      // Asegura que el runtime de JSX se resuelva correctamente
      'react/jsx-runtime': 'react/jsx-runtime'
    }
  }
});
