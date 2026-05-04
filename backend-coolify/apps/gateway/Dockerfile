# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only required files
COPY package.json pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY turbo.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build specific service
ARG SERVICE_NAME
RUN pnpm --filter $SERVICE_NAME build


# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy ONLY built output
COPY --from=builder /app/apps/*/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8000

CMD ["node", "dist/index.js"]