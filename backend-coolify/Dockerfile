# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME
# Fallback to standard layout if APP_PATH isn't provided
ARG APP_PATH=apps/${SERVICE_NAME}
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

RUN pnpm install --frozen-lockfile

COPY ${APP_PATH} ./apps/${SERVICE_NAME}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 STAGE 2: RUNNER
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
ARG SERVICE_NAME
ARG APP_PATH=apps/${SERVICE_NAME}
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy only required files and folders for the production install
COPY pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./package.json
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# 2. Strip workspace deps so pnpm doesn't look for folders
# Since @repo packages are already bundled into ./dist, we don't need them in node_modules
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  delete pkg.dependencies['@repo/shared']; \
  delete pkg.dependencies['@repo/database']; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# 3. Install ALL production dependencies (express, bcrypt, mongoose, etc.)
RUN pnpm install --prod --no-frozen-lockfile

# 4. Define the Global Default Healthcheck
# This will be inherited by gateway, account, post, worker, etc.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["node", "dist/index.js"]