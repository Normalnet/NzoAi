#!/bin/sh
# Start the WebSocket escalation server in background
node apps/server/dist/index.js &

# Start the TanStack Start Web application
node apps/web/.output/server/index.mjs
