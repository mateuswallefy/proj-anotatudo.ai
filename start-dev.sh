#!/bin/bash
export NODE_ENV=development
concurrently "npm run dev:server" "npm run dev:vite"
