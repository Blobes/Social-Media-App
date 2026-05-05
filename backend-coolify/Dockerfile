# =========================
# 🏗️ BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app
ARG SERVICE_NAME

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# We need the package.json files for all internal packages to resolve links
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY packages ./packages

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source for the specific app
COPY apps/${SERVICE_NAME} ./apps/${SERVICE_NAME}

# Build only target service
RUN pnpm --filter=@repo/${SERVICE_NAME} build

# =========================
# 🚀 RUNTIME STAGE
# =========================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ARG SERVICE_NAME

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# 1. Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2. Copy the service's package.json (PNPM needs this to know what to install)
COPY apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/

# 3. Copy the shared packages (PNPM needs these to link them)
COPY packages ./packages

# 4. Copy the actual built code
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

# Install production dependencies
# This now works because PNPM can see the workspace structure
RUN pnpm install --prod --frozen-lockfile

USER appuser

EXPOSE 8000

CMD ["node", "dist/index.js"]