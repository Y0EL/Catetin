FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY patches ./patches
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/chat-core/package.json packages/chat-core/package.json
COPY packages/prompts/package.json packages/prompts/package.json
RUN pnpm install --frozen-lockfile --filter @catetin/api... && pnpm store prune

FROM deps AS runtime
COPY apps/api ./apps/api
COPY packages ./packages
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
WORKDIR /app/apps/api
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
