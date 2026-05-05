# =========================
# 🏗️ STAGE 1: PRUNER
# =========================
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Install turbo globally to slice the monorepo
RUN pnpm add -g turbo@latest

COPY . .
# Extract only the target service and its workspace dependencies
RUN turbo prune @repo/${SERVICE_NAME} --docker

# =========================
# 🏗️ STAGE 2: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy pruned locks and package.json files for maximum layer caching
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies (only what's needed for this service)
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/${SERVICE_NAME}

# =========================
# 🚀 STAGE 3: RUNTIME
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

# Security: Non-root execution
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Explicitly copy production artifacts
# We copy the node_modules from the builder because they contain 
# the correctly linked internal workspace packages (@repo/shared)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist
COPY --from=builder /app/apps/${SERVICE_NAME}/package.json ./package.json

# Copy shared packages if they are referenced at runtime
COPY --from=builder /app/packages ./packages

USER appuser
EXPOSE 8000

# Use the specific dist entry point
CMD ["node", "dist/index.js"]