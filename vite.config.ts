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
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
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
