# =========================
# 🏗️ STAGE 1: BUILDER
# =========================
FROM node:20-alpine AS builder
WORKDIR /app
ARG SERVICE_NAME
ARG APP_PATH=apps/${SERVICE_NAME}
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy workspace structural configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# COPY to ${APP_PATH}/ instead of forcing it into apps/${SERVICE_NAME}/
COPY ${APP_PATH}/package.json ./${APP_PATH}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# This will now validate cleanly against the lockfile rules
RUN pnpm install --frozen-lockfile

# Maintain identical source paths
COPY ${APP_PATH} ./${APP_PATH}
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

# Copy required deployment files
COPY pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./package.json
COPY --from=builder /app/${APP_PATH}/dist ./dist

# Strip workspace references out before production execution
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  delete pkg.dependencies['@repo/shared']; \
  delete pkg.dependencies['@repo/database']; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

RUN pnpm install --prod --no-frozen-lockfile

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["node", "dist/index.js"]