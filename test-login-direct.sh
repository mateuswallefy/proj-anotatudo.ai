#!/bin/bash
# Teste direto do login sem passar pelo Vite proxy
# Este script testa se o backend retorna 403 ou se o problema está no proxy

echo "============================================"
echo "TESTE DIRETO: POST /api/auth/login"
echo "============================================"
echo ""
echo "Testando diretamente no backend (http://localhost:5050)"
echo "Sem passar pelo Vite proxy (http://localhost:5173)"
echo ""

# Substitua pelos seus dados de teste
EMAIL="seu-email@exemplo.com"
PASSWORD="sua-senha"

echo "Email: $EMAIL"
echo ""

# Fazer POST direto
curl -v -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c cookies.txt \
  -b cookies.txt

echo ""
echo "============================================"
echo "Status code acima mostra o que o backend retorna"
echo "Se for 200 ou 401, o backend está OK"
echo "Se for 403, o problema está no backend"
echo "============================================"

