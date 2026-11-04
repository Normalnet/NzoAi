#!/bin/sh
# Start the WebSocket escalation server in background
node apps/server/dist/index.js &

# Start the NzoAI Web production server (static SPA + API dispatcher)
pnpm --filter @nzoai/web start
