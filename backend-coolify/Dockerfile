# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

# Setup pnpm 10
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy workspace scaffolding
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# 2. Install EVERYTHING (needed for tsup to run)
RUN pnpm install --frozen-lockfile

# 3. Copy source code
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

# 4. Run the build (tsup handles the bundling here)
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 STAGE 2: RUNNER
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

# Security: Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 1. Copy the bundled output from builder
# Because tsup bundled everything (bundle: true), we ONLY need the dist folder!
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 2. Copy production-only package.json
# This allows Node to see "type": "module"
COPY apps/${SERVICE_NAME}/package.json ./package.json

COPY pnpm-workspace.yaml ./
COPY apps/${SERVICE_NAME}/package.json ./package.json

# 3. Install only external prod dependencies (like express, mongoose)
# Note: We don't need /packages anymore because tsup bundled them into dist/
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# ESM resolution works perfectly because there's only ONE file: dist/index.js
CMD ["node", "dist/index.js"]