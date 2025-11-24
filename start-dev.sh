#!/bin/bash
cd /home/runner/workspace
export NODE_ENV=development
export PORT=3000
exec tsx server/index.ts
