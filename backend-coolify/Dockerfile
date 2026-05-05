# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Workspace metadata (needed for install)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Source code
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages ./packages

# Install ALL dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Build only target service
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

# Copy only runtime artifacts
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# Copy package metadata (needed for pnpm install)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ONLY production dependencies (correct for pnpm)
RUN pnpm install --prod --frozen-lockfile

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]