# =========================
# 🏗️ BUILDER STAGE
# =========================
FROM node:20-alpine AS builder

# Public vars needed at build time for Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# App name passed from Coolify (e.g., shell-app)
ARG APP_NAME

# Pin pnpm version for consistency
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json i18next.config.ts locale-script.ts  ./
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the specific app
RUN pnpm --filter $APP_NAME build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

# Re-declare ARG so it's available in this stage
ARG APP_NAME
# Set an ENV variable so the CMD can access it at runtime
ENV APP_NAME=$APP_NAME
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Next.js Standalone Mode Layout:
COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=appuser:appgroup /app/apps/${APP_NAME}/public* ./apps/${APP_NAME}/public/

USER appuser

EXPOSE 3000

CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]