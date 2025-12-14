import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "replit-iframe",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.removeHeader?.("X-Frame-Options");
          res.setHeader("X-Frame-Options", "ALLOWALL");
          // NÃO definir CORS aqui - o backend já configura CORS corretamente
          // Definir aqui pode causar conflito com o CORS do backend
          next();
        });
      },
    },
    react(),
    {
      name: "log-proxy",
      configureServer(server) {
        console.log("✅ [Vite] Proxy configurado: /api → http://localhost:5050");
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api')) {
            console.log(`[Vite Proxy] ${req.method} ${req.url} → http://localhost:5050${req.url}`);
          }
          next();
        });
      },
    },
  ],

  root: path.resolve(import.meta.dirname, "client"),

  server: {
    host: true,
    port: 5173,
    strictPort: true,

    headers: {
      "X-Frame-Options": "ALLOWALL",
    },

    proxy: {
      "/api": {
        target: "http://localhost:5050", // Backend DEV na porta 5050 (fixa)
        changeOrigin: true,
        secure: false,
        // Garantir que cookies sejam preservados
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Preservar cookies na requisição
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('[Vite Proxy] Erro ao conectar com backend:', err.message);
            console.error('[Vite Proxy] Certifique-se de que o backend está rodando em http://localhost:5050');
          });
        },
      },
    },
  },

  clearScreen: false,

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
