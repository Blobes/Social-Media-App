# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all package.json files first (Optimizes layer caching)
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Copy the actual source code
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Build only the target service
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2. Copy compiled code from builder
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 3. Copy the package.json and packages (PNPM needs these for symlinks)
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages ./packages

# 4. Install production dependencies
# This creates the symlinks from node_modules to your @repo/shared source
RUN pnpm install --prod --frozen-lockfile

USER appuser
EXPOSE 8000

# Use sh -c if you need to expand variables, but usually node dist works
CMD ["node", "dist/index.js"]