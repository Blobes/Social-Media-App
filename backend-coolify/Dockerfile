# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Explicitly copy only the workspace configuration and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Explicitly copy the package.json for the target app and its internal dependencies
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies (Layered for caching)
RUN pnpm install --frozen-lockfile

# Explicitly copy the source code for the target app and packages
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

# Build the target service
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 STAGE 2: RUNTIME
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Explicitly copy workspace metadata for runtime dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Copy the built artifacts from the builder stage
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist
# We must copy the source of internal packages because @repo/shared main points to .ts
COPY --from=builder /app/packages ./packages

# Install production dependencies only
# This resolves the symlinks for @repo/shared and its dependencies (like express)
RUN pnpm install --prod --frozen-lockfile

# Final permission hardening
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]