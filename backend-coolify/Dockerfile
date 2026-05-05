# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Explicitly copy only necessary metadata for installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# 2. Install all dependencies (caching layer)
RUN pnpm install --frozen-lockfile

# 3. Explicitly copy source code
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

# 4. Build artifacts
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# 5. 🚀 ISOLATE: Create a production-ready standalone directory
# This command extracts the app and its internal workspace deps into /app/isolated
RUN pnpm --filter=@repo/${SERVICE_NAME} --prod deploy /app/isolated

# =========================
# 🚀 STAGE 2: RUNNER
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 1. Copy the isolated bundle (This contains the production node_modules + package.json)
COPY --from=builder /app/isolated ./

# 2. Copy the built production JS from the builder stage
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 3. Copy internal packages (since your imports still point to internal source)
COPY --from=builder /app/packages ./packages

# Permission hardening
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# ESM resolution now finds 'express' because 'pnpm deploy' flattened the dependencies correctly
CMD ["node", "dist/index.js"]