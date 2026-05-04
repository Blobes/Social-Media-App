# =========================
# 🏗️ BUILDER STAGE
# =========================
FROM node:20-alpine AS builder

# Accept ONLY safe public variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# Enable pnpm safely
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only necessary files (avoid leaking .env)
COPY package.json pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY turbo.json ./

# Install dependencies (frozen for reproducibility)
RUN pnpm install --frozen-lockfile

# Build specific app (passed via build context)
ARG APP_NAME
RUN pnpm --filter $APP_NAME build


# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user (security best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy only built output (NO source code, NO env)
COPY --from=builder /app/apps/*/.next/standalone ./
COPY --from=builder /app/apps/*/.next/static ./apps
COPY --from=builder /app/apps/*/public ./apps

EXPOSE 3000

CMD ["node", "apps/server.js"]