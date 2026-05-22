# =========================
# 🏗️ STAGE 1: GO BUILDER
# =========================
FROM golang:1.26-alpine AS go-builder
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY apps/worker-service/go-worker/go.mod apps/worker-service/go-worker/go.sum ./
RUN go mod download
COPY apps/worker-service/go-worker/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o go-worker-bin ./cmd/main.go

# =========================
# 🏗️ STAGE 2: NODE BUILDER
# =========================
FROM node:20-alpine AS node-builder
WORKDIR /app
ARG SERVICE_NAME
ARG APP_PATH=apps/${SERVICE_NAME}
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./${APP_PATH}/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

RUN pnpm install --frozen-lockfile

COPY ${APP_PATH} ./${APP_PATH}
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 TARGET: GO RUNNER
# =========================
FROM alpine:3.19 AS go-runner
WORKDIR /app
RUN apk add --no-cache curl ca-certificates

# Copy ONLY the compiled Go binary from Stage 1
COPY --from=go-builder /app/go-worker-bin ./go-worker-bin

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["./go-worker-bin"]

# =========================
# 🚀 TARGET: NODE RUNNER
# =========================
FROM node:20-alpine AS node-runner
WORKDIR /app
RUN apk add --no-cache curl

ARG SERVICE_NAME
ARG APP_PATH=apps/${SERVICE_NAME}
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY pnpm-workspace.yaml ./
COPY ${APP_PATH}/package.json ./package.json
COPY --from=node-builder /app/${APP_PATH}/dist ./dist

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