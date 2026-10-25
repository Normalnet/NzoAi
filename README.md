# NzoAI

Autonomous multi-tenant AI customer support platform. Train chatbots on custom knowledge bases, embed interactive chat widgets, and seamlessly escalate to human agents over realtime WebSockets.

## Monorepo Structure

- `apps/web`: React 19 + Vite + TanStack Router web application, admin dashboard, RAG engine, and API routes.
- `apps/server`: Express + WebSocket realtime chat escalation server (`/ws`).
- `packages/store`: `@nzoai/store` shared Zustand chat state management package.

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10
- PostgreSQL with `pgvector` extension

### Installation

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` in `apps/web` and `apps/server`:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

### Development

Run all services in development mode:

```bash
pnpm dev
```

- Web App: `http://localhost:3001`
- WebSocket Server: `ws://localhost:3000/ws`

### Building for Production

```bash
pnpm build
```

## Deployment

Configured for deployment on Vercel as a multi-service project (`vercel.json`) with internal service bindings and routing.
