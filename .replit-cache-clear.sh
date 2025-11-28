#!/bin/bash
# Script para limpar cache do Replit e forçar rebuild completo

echo "🧹 Limpando cache do Replit..."

# Limpar builds
rm -rf dist .next build public/build

# Limpar caches do Vite
rm -rf .cache/vite .vite node_modules/.vite

# Limpar caches do Tailwind
rm -rf .cache/tailwindcss node_modules/.cache/tailwindcss

# Limpar caches do Node
rm -rf node_modules/.cache

# Limpar cache do npm
npm cache clean --force

echo "✅ Cache limpo! Execute 'npm run rebuild' para reconstruir."


