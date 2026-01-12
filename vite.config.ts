import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  root: path.resolve(__dirname, "client"),

  server: {
    host: '127.0.0.1', // IPv4 explícito (força IPv4 no macOS)
    port: 5173,
    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050', // IPv4 explícito (não usar localhost)
        changeOrigin: true, // CRÍTICO: muda o host header para o target
        secure: false, // Permitir HTTP em DEV
        ws: true, // Suportar WebSocket
        proxyTimeout: 60000, // Timeout de 60s
        timeout: 60000,
        // Preservar path original (não reescrever)
        rewrite: (path) => path,
        // Configuração robusta para diagnóstico
        configure: (proxy, _options) => {
          // Log de requisições enviadas ao backend
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[VITE PROXY] → ${req.method} ${req.url} → http://127.0.0.1:5050${req.url}`);
          });
          
          // Log de respostas do backend
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const statusCode = proxyRes.statusCode || 0;
            const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                               statusCode >= 400 && statusCode < 500 ? '⚠️' : 
                               statusCode >= 500 ? '❌' : '🔵';
            console.log(`[VITE PROXY] ${statusEmoji} ← ${statusCode} ${req.method} ${req.url}`);
          });
          
          // Handler de erros do proxy (ECONNREFUSED, ENOTFOUND, etc)
          proxy.on('error', (err: NodeJS.ErrnoException, req, res) => {
            console.error('❌ [VITE PROXY] ERRO NO PROXY ❌');
            console.error(`[VITE PROXY] Erro: ${err.code || err.message}`);
            console.error(`[VITE PROXY] Mensagem: ${err.message}`);
            console.error(`[VITE PROXY] URL requisitada: ${req.url}`);
            console.error(`[VITE PROXY] Target: http://127.0.0.1:5050`);
            
            // Diagnosticar tipo de erro
            if (err.code === 'ECONNREFUSED') {
              console.error('[VITE PROXY] 💡 Backend não está rodando ou não está escutando em 127.0.0.1:5050');
              console.error('[VITE PROXY] 💡 Execute: npm run server (em outro terminal)');
            } else if (err.code === 'ENOTFOUND') {
              console.error('[VITE PROXY] 💡 Não foi possível resolver o hostname');
              console.error('[VITE PROXY] 💡 Certifique-se de usar 127.0.0.1 (não localhost)');
            } else if (err.code === 'ETIMEDOUT') {
              console.error('[VITE PROXY] 💡 Timeout ao conectar com o backend');
            }
            
            // Retornar resposta JSON de erro em vez de deixar o browser receber erro genérico
            if (!res.headersSent) {
              res.writeHead(502, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                error: 'Proxy Error',
                message: 'Falha ao conectar com o backend',
                code: err.code || 'PROXY_ERROR',
                details: import.meta.env.DEV ? err.message : undefined,
              }));
            }
          });
          
          // Handler para timeouts
          proxy.on('timeout', (req, res) => {
            console.error('❌ [VITE PROXY] TIMEOUT');
            console.error(`[VITE PROXY] URL: ${req.url}`);
            if (!res.headersSent) {
              res.writeHead(504, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({
                error: 'Gateway Timeout',
                message: 'Backend não respondeu a tempo',
                code: 'PROXY_TIMEOUT',
              }));
            }
          });
        },
      },
    },
  },

  clearScreen: false,

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
