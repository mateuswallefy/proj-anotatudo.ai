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
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
        // CRÍTICO: rewrite explícito para garantir que o path seja preservado
        rewrite: (path) => {
          // Não modificar o path - apenas retornar como está
          // Isso garante que /api/auth/login vira http://localhost:5050/api/auth/login
          return path;
        },
        // CRÍTICO: Configuração do proxy com logs detalhados
        configure: (proxy, _options) => {
          // Log de TODA requisição sendo proxyada
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log("🔥🔥🔥 [VITE PROXY] →", req.method, req.url);
            console.log("🔥 [VITE PROXY] Target:", "http://localhost:5050");
            console.log("🔥 [VITE PROXY] Full URL:", `http://localhost:5050${req.url}`);
            console.log("🔥 [VITE PROXY] Headers:", {
              'content-type': req.headers['content-type'] || 'none',
              'origin': req.headers.origin || 'none',
              'cookie': req.headers.cookie ? 'present' : 'none'
            });
            
            // Preservar cookies na requisição
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            
            // Preservar outros headers importantes
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
          });
          
          // Log da resposta do backend
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const serverHeader = proxyRes.headers['server'] || '';
            console.log("🔥🔥🔥 [VITE PROXY] ←", proxyRes.statusCode, req.url);
            console.log("🔥 [VITE PROXY] Server header:", serverHeader);
            
            // CRÍTICO: Verificar se a resposta veio do Express ou de outro servidor
            if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
              console.error("🔥🔥🔥 [VITE PROXY] ⚠️ ERRO CRÍTICO: Request não passou pelo backend!");
              console.error("🔥 [VITE PROXY] Server header:", serverHeader);
              console.error("🔥 [VITE PROXY] Proxy não aplicado corretamente!");
              console.error("🔥 [VITE PROXY] A requisição foi resolvida localmente (AirTunes?)");
            }
            
            // Log de Set-Cookie se presente
            if (proxyRes.headers['set-cookie']) {
              console.log("🔥 [VITE PROXY] Set-Cookie:", proxyRes.headers['set-cookie']);
            }
            
            // Alerta se backend retornou 403
            if (proxyRes.statusCode === 403) {
              console.error("🔥🔥🔥 [VITE PROXY] ⚠️ ATENÇÃO: Backend retornou 403!");
              console.error("🔥 [VITE PROXY] Isso NÃO deveria acontecer - backend nunca retorna 403 no login");
            }
          });
          
          // Log de erros do proxy
          proxy.on('error', (err, req, _res) => {
            console.error("🔥🔥🔥 [VITE PROXY] ERRO no proxy 🔥🔥🔥");
            console.error('[Vite Proxy] Erro:', err.message);
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
