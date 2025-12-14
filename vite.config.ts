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
          // 🔥 AUDITORIA: Log de TODA requisição /api
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log("🔥🔥🔥 [VITE PROXY] Requisição sendo proxyada 🔥🔥🔥");
            console.log("🔥 [VITE PROXY] Method:", req.method);
            console.log("🔥 [VITE PROXY] URL original:", req.url);
            console.log("🔥 [VITE PROXY] Target:", "http://localhost:5050");
            console.log("🔥 [VITE PROXY] URL completa:", `http://localhost:5050${req.url}`);
            console.log("🔥 [VITE PROXY] Headers:", {
              'content-type': req.headers['content-type'],
              'origin': req.headers.origin,
              'cookie': req.headers.cookie || 'none'
            });
            
            // Preservar cookies na requisição
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
              console.log("🔥 [VITE PROXY] Cookies preservados:", req.headers.cookie);
            }
          });
          
          // 🔥 AUDITORIA: Log da resposta do backend
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log("🔥🔥🔥 [VITE PROXY] Resposta recebida do backend 🔥🔥🔥");
            console.log("🔥 [VITE PROXY] Status code do backend:", proxyRes.statusCode);
            console.log("🔥 [VITE PROXY] Headers da resposta:", proxyRes.headers);
            console.log("🔥 [VITE PROXY] Set-Cookie header:", proxyRes.headers['set-cookie'] || 'none');
            
            // CRÍTICO: Se backend retornou 200/401 mas proxy está retornando 403, há problema aqui
            if (proxyRes.statusCode === 403) {
              console.error("🔥🔥🔥 [VITE PROXY] ⚠️ ATENÇÃO: Backend retornou 403!");
              console.error("🔥 [VITE PROXY] Isso NÃO deveria acontecer - backend nunca retorna 403 no login");
            }
          });
          
          proxy.on('error', (err, req, _res) => {
            console.error("🔥🔥🔥 [VITE PROXY] ERRO no proxy 🔥🔥🔥");
            console.error('[Vite Proxy] Erro ao conectar com backend:', err.message);
            console.error('[Vite Proxy] URL:', req.url);
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
