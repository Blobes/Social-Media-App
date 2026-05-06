FROM node:20-alpine AS builder

WORKDIR /app

ARG SERVICE_NAME

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

RUN pnpm install --frozen-lockfile

# 👇 THIS is what you are missing clarity on
RUN pnpm --filter=@repo/${SERVICE_NAME} build


FROM node:20-alpine

WORKDIR /app

ARG SERVICE_NAME

COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./dist

CMD ["node", "dist/index.js"]