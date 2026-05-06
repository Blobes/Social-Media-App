FROM node:20-alpine

WORKDIR /app

ARG SERVICE_NAME

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY apps/${SERVICE_NAME}/dist ./dist

EXPOSE 8000

CMD ["node", "dist/index.js"]