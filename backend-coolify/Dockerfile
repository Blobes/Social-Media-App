# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Only required code
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages ./packages

# Install all deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Build service
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

# Copy built output
COPY --chown=appuser:appgroup --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 🔥 CRITICAL: copy node_modules from builder
COPY --chown=appuser:appgroup --from=builder /app/node_modules ./node_modules

# Optional: shared packages (ONLY if you use workspace imports at runtime)
COPY --chown=appuser:appgroup --from=builder /app/packages ./packages

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]