# =========================
# 🏗️ STAGE 1: PRUNER
# =========================
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG SERVICE_NAME

# Enable pnpm via corepack before attempting to use it
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Install turbo globally for monorepo slicing
RUN pnpm add -g turbo@latest

# Copy workspace metadata for pruning
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages ./packages

# Extract only the target service and its workspace dependencies
RUN turbo prune @repo/${SERVICE_NAME} --docker

# =========================
# 🏗️ STAGE 2: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy pruned lockfile and package.json files for dependency resolution
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 2. Install dependencies (Optimized for caching)
RUN pnpm install --frozen-lockfile

# 3. Copy pruned source code and execute build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/${SERVICE_NAME}

# =========================
# 🚀 STAGE 3: RUNTIME (Runner)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Enable pnpm in runner to handle production install
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy root workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2. Copy the specific service package.json and built artifacts
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 3. Copy internal package source code 
# Necessary because your ESM imports point to .ts files in development
COPY --from=builder /app/packages ./packages

# 4. Perform production-only install
# This links the @repo/shared and @repo/database packages correctly
RUN pnpm install --prod --frozen-lockfile

# Hardening permissions
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]