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

# Only enable corepack if we actually need to install something
RUN if [ "$SERVICE_NAME" = "account-service" ]; then \
      corepack enable && corepack prepare pnpm@10.30.1 --activate; \
    fi

# 1. Copy the bundled code (Always needed)
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist
COPY pnpm-workspace.yaml* apps/${SERVICE_NAME}/package.json* ./

# 2. Conditional Production Install
# This block only runs for services with native binaries (bcrypt)
RUN if [ "$SERVICE_NAME" = "account-service" ]; then \
        # Strip workspace deps so pnpm doesn't look for folders
        sed -i '/"@repo\/shared": "workspace:\*"/d' package.json && \
        sed -i '/"@repo\/database": "workspace:\*"/d' package.json && \
        # Install native dependencies
        pnpm install --prod --no-frozen-lockfile --ignore-scripts; \
    else \
        rm -f pnpm-workspace.yaml package.json; \
        echo "Skipping pnpm install for $SERVICE_NAME (Fully Bundled)"; \
    fi

EXPOSE 8000

CMD ["node", "dist/index.js"]