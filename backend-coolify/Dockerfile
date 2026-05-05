# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

# Enable Corepack and pin PNPM 10
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Explicitly copy workspace metadata (Deterministic Scaffolding)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# 2. Install dependencies (Layered for caching)
RUN pnpm install --frozen-lockfile

# 3. Explicitly copy source code for the build
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

# 4. Execute Build
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# 5. 🚀 THE FIX: Deploy with --legacy
# In PNPM 10, --legacy flattens the workspace into a portable, standalone directory.
# This eliminates the "express not found" error by resolving symlinks to real files.
RUN pnpm --filter=@repo/${SERVICE_NAME} --prod deploy /app/isolated --legacy

# =========================
# 🚀 STAGE 2: RUNTIME (Runner)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 1. Copy the isolated standalone bundle
# This folder now contains its own node_modules with express physically present
COPY --from=builder --chown=appuser:appgroup /app/isolated ./

# 2. Copy the compiled JS artifacts
COPY --from=builder --chown=appuser:appgroup /app/apps/${SERVICE_NAME}/dist ./dist

# 3. Reference internal packages if your ESM imports require them
# (Optional: Only if your dist/ index.js imports directly from packages/src)
COPY --from=builder --chown=appuser:appgroup /app/packages ./packages

USER appuser
EXPOSE 8000

# ESM resolution now succeeds because node_modules is self-contained and flat
CMD ["node", "dist/index.js"]