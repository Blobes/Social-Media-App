# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine

WORKDIR /app
ARG SERVICE_NAME
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy only what is needed
COPY --chown=appuser:appgroup --from=builder /app/apps/${SERVICE_NAME}/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/package.json ./
COPY --chown=appuser:appgroup --from=builder /app/pnpm-lock.yaml ./
COPY --chown=appuser:appgroup --from=builder /app/pnpm-workspace.yaml ./

# Install production deps only
RUN pnpm install --prod --frozen-lockfile

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]