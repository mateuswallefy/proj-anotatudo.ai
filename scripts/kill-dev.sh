#!/bin/bash

echo "🔥 Processos ativos relacionados a Vite:"
ps aux | grep vite | grep -v grep

echo ""
echo "🔥 Processos ativos relacionados a TSX:"
ps aux | grep tsx | grep -v grep

echo ""
echo "🔥 Processos ativos relacionados a Concurrently:"
ps aux | grep concurrently | grep -v grep

echo ""
echo "💡 Para matar manualmente, execute:"
echo "pkill -9 -f vite"
echo "pkill -9 -f \"tsx server/index.ts\""
echo "pkill -9 -f concurrently"

echo ""
echo "⚠️ Não mato automaticamente para evitar derrubar sessão SSH."

