import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  root: path.resolve(__dirname, "client"),

  server: {
    host: '127.0.0.1', // IPv4 explícito
    port: 5173,
    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        secure: false,
        // Preservar path original (não reescrever)
        rewrite: (path) => path,
        // Configuração adicional para garantir conexão
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.error('[VITE PROXY] Erro:', err.message);
            console.error('[VITE PROXY] URL:', req.url);
            console.error('[VITE PROXY] Certifique-se de que o backend está rodando em http://127.0.0.1:5050');
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[VITE PROXY] →', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[VITE PROXY] ←', proxyRes.statusCode, req.url);
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
