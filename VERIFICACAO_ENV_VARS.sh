#!/bin/bash

echo "=================================================================================="
echo "📋 VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE - BANCO DE DADOS"
echo "=================================================================================="
echo ""

echo "1️⃣  VARIÁVEIS PG* (DEVEM ESTAR VAZIAS):"
echo "=================================================================================="
for var in PGDATABASE PGHOST PGPORT PGUSER PGPASSWORD; do
  if [ -n "${!var}" ]; then
    echo "❌ $var=${!var}"
  else
    echo "✅ $var não está definida"
  fi
done
echo ""

echo "2️⃣  DATABASE_URL (DEVE APONTAR PARA NEON):"
echo "=================================================================================="
if [ -n "$DATABASE_URL" ]; then
  # Mascarar senha na URL
  MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
  if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "✅ DATABASE_URL está apontando para Neon"
  else
    echo "⚠️  DATABASE_URL NÃO está apontando para Neon"
  fi
  echo "   $MASKED_URL"
else
  echo "❌ DATABASE_URL não está definida!"
fi
echo ""

echo "3️⃣  TODAS AS VARIÁVEIS DE BANCO:"
echo "=================================================================================="
env | grep -E "^(PG|DATABASE)" | sort
echo ""

echo "4️⃣  RESUMO:"
echo "=================================================================================="
PG_COUNT=$(env | grep -c "^PG" || echo "0")
if [ "$PG_COUNT" -eq 0 ]; then
  echo "✅ Nenhuma variável PG* encontrada (correto!)"
else
  echo "❌ $PG_COUNT variável(is) PG* encontrada(s) - PRECISA CORRIGIR!"
fi

if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
  echo "✅ DATABASE_URL está correta (Neon)"
else
  echo "❌ DATABASE_URL não está correta ou não está definida"
fi
echo ""


