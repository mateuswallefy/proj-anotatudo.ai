#!/bin/bash

echo ">>> Killing all dev ports (5050, 5123, 5173, 5174, 5175)..."

for PORT in 5050 5123 5173 5174 5175; do
  PIDS=$(lsof -t -i:$PORT)
  if [[ ! -z "$PIDS" ]]; then
    echo "Killing processes on port $PORT: $PIDS"
    kill -9 $PIDS || true
  else
    echo "Port $PORT is free."
  fi
done

echo ">>> Also killing any remaining Node processes..."
pkill -f node || true

echo ">>> Dev environment reset complete."





