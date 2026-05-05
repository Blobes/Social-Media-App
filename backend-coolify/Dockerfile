# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Workspace metadata only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Source code
COPY apps ./apps
COPY packages ./packages

# Install full workspace (needed for build)
RUN pnpm install --frozen-lockfile

# Build only target service
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# 🔥 KEY FIX: create isolated production bundle
RUN pnpm --filter=@repo/${SERVICE_NAME} deploy /app/runtime --prod

# =========================
# 🚀 STAGE 2: RUNTIME (Runner)
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy isolated runtime bundle ONLY
COPY --from=builder /app/runtime ./

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]