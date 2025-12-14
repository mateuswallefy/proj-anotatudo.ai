import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "replit-iframe",
      configureServer(server) {
        // CRÍTICO: Middleware deve ser executado APÓS o proxy
        // Por isso, não interceptamos /api aqui
        server.middlewares.use((req, res, next) => {
          // Não interferir com requisições /api - deixar o proxy lidar
          if (req.url?.startsWith('/api')) {
            return next();
          }
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
      name: "proxy-protection",
      configureServer(server) {
        console.log("✅ [Vite] Proxy configurado: ^/api/.* → http://localhost:5050");
        // CRÍTICO: Middleware de proteção - bloqueia se /api não foi proxyada
        // Este middleware é executado APÓS o proxy, então se chegou aqui sem ser proxyada, há problema
        server.middlewares.use((req, res, next) => {
          // Se a requisição começa com /api e chegou neste middleware, algo está errado
          // O proxy deveria ter interceptado antes
          if (req.url?.startsWith('/api')) {
            console.error("🔥🔥🔥 [VITE PROTECTION] ⚠️ ERRO: Requisição /api chegou no middleware sem ser proxyada!");
            console.error("🔥 [VITE PROTECTION] URL:", req.url);
            console.error("🔥 [VITE PROTECTION] Isso NÃO deveria acontecer - proxy deveria ter interceptado");
            // Não bloquear, mas logar o erro crítico
            // O proxy do Vite deve interceptar antes, mas se não interceptou, há problema de configuração
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
      // CRÍTICO: Usar regex explícita para garantir interceptação
      '^/api/.*': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
        ws: true, // Suporte a WebSocket
        // CRÍTICO: rewrite explícito - não modificar path
        rewrite: (path) => path,
        // CRÍTICO: Configuração do proxy com logs detalhados
        configure: (proxy, _options) => {
          // Log de TODA requisição sendo proxyada
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[VITE PROXY] →', req.method, req.url);
          });
          
          // Log da resposta do backend
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const serverHeader = proxyRes.headers['server'] || '';
            console.log('[VITE PROXY] ←', proxyRes.statusCode, req.url);
            
            // CRÍTICO: Verificar se a resposta veio do Express ou de outro servidor
            if (serverHeader && !serverHeader.toLowerCase().includes('express') && !serverHeader.toLowerCase().includes('node')) {
              console.error("🔥🔥🔥 [VITE PROXY] ⚠️ ERRO CRÍTICO: Request não passou pelo backend!");
              console.error("🔥 [VITE PROXY] Server header:", serverHeader);
              console.error("🔥 [VITE PROXY] Proxy não aplicado corretamente!");
              console.error("🔥 [VITE PROXY] A requisição foi resolvida localmente (AirTunes?)");
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
