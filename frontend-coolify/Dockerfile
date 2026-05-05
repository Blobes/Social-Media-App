# =========================
# 🏗️ BUILDER STAGE
# =========================
FROM node:20-alpine AS builder

# Public vars needed at build time for Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# Pin pnpm version to match your local environment (e.g., 10.30.1)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# App name passed from Coolify (e.g., shell-app)
ARG APP_NAME
RUN pnpm --filter $APP_NAME build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone mode requires this to find dependencies correctly
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ARG APP_NAME

COPY --from=builder /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

EXPOSE 3000

# Next.js standalone places the entry point here
CMD ["node", "apps/shell-app/server.js"]