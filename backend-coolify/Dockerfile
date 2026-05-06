# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

RUN pnpm install --frozen-lockfile

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

# 1. Copy the bundle and metadata
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist
COPY apps/${SERVICE_NAME}/package.json ./package.json
COPY pnpm-lock.yaml ./

# 2. Clean package.json so it's a standalone production file
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  delete pkg.dependencies['@repo/shared']; \
  delete pkg.dependencies['@repo/database']; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# 3. Install ALL external production dependencies
RUN pnpm install --prod --no-frozen-lockfile

EXPOSE 8000

# 🚀 THE CRITICAL RUNTIME FLAG: 
# This fixes ERR_UNSUPPORTED_DIR_IMPORT for ioredis and others.
CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"]