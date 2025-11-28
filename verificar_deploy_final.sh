#!/bin/bash

echo "=================================================================================="
echo "🔍 VERIFICAÇÃO FINAL DO DEPLOY AUTOSCALE"
echo "=================================================================================="
echo ""

echo "1️⃣  VARIÁVEIS PG* (DEVEM ESTAR VAZIAS):"
echo "=================================================================================="
PG_VARS=$(env | grep "^PG")
if [ -z "$PG_VARS" ]; then
  echo "✅ Nenhuma variável PG* encontrada (CORRETO!)"
else
  echo "❌ VARIÁVEIS PG* ENCONTRADAS:"
  echo "$PG_VARS"
  echo ""
  echo "⚠️  AÇÃO NECESSÁRIA: Remova essas variáveis dos Secrets do Replit!"
fi
echo ""

echo "2️⃣  DATABASE_URL:"
echo "=================================================================================="
if [ -n "$DATABASE_URL" ]; then
  MASKED_URL=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')
  if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "✅ DATABASE_URL está apontando para Neon"
  else
    echo "⚠️  DATABASE_URL NÃO está apontando para Neon!"
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

echo "4️⃣  RESUMO COMPLETO:"
echo "=================================================================================="
PG_COUNT=$(env | grep -c "^PG" || echo "0")
if [ "$PG_COUNT" -eq 0 ]; then
  echo "✅ Nenhuma variável PG* encontrada"
else
  echo "❌ $PG_COUNT variável(is) PG* encontrada(s)"
fi

if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
  echo "✅ DATABASE_URL está correta (Neon)"
else
  echo "❌ DATABASE_URL não está correta"
fi
echo ""

echo "5️⃣  TODAS AS VARIÁVEIS DE AMBIENTE (para análise completa):"
echo "=================================================================================="
echo "Execute: env | sort"
echo ""

