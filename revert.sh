#!/bin/bash
echo "⏮️ Voltando 1 commit..."
git reset --hard HEAD~1
git push origin main -f
echo "✅ PRONTO! Voltou 1 commit e enviou para GitHub!"
