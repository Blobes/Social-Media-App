# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# ✅ Copy ONLY the service + shared packages
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages ./packages

# Install deps
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

# Copy built service
COPY --chown=appuser:appgroup --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# Copy workspace essentials
COPY --chown=appuser:appgroup --from=builder /app/package.json ./
COPY --chown=appuser:appgroup --from=builder /app/pnpm-lock.yaml ./
COPY --chown=appuser:appgroup --from=builder /app/pnpm-workspace.yaml ./

# ✅ Copy shared packages
COPY --chown=appuser:appgroup --from=builder /app/packages ./packages

# Install only prod deps
RUN pnpm install --prod --frozen-lockfile

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]