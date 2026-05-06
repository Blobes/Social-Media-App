# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Surgical Copy for metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

RUN pnpm install --frozen-lockfile

# Surgical Copy for source
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 STAGE 2: RUNNER
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. 🚀 THE HYBRID FIX: Copy metadata and bundled code
COPY pnpm-workspace.yaml ./
COPY apps/${SERVICE_NAME}/package.json ./package.json
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 2. Install ONLY production dependencies (specifically bcrypt)
# pnpm will see express is bundled (via noExternal) and will focus on bcrypt
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

EXPOSE 8000

CMD ["node", "dist/index.js"]