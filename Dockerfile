FROM node:21-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Stage 1: Dependencies
FROM base AS dependencies
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/store/package.json ./packages/store/
RUN pnpm install --frozen-lockfile || pnpm install

# Stage 2: Builder
FROM dependencies AS builder
COPY . .

# Build store package first
RUN pnpm --filter @nzoai/store build

# Build web and server
RUN pnpm --filter @nzoai/server build
RUN pnpm --filter @nzoai/web build

# Stage 3: Runner
FROM node:21-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/web/.output ./apps/web/.output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/packages/store/dist ./packages/store/dist
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x ./start.sh

EXPOSE 3000 3001

CMD ["./start.sh"]
