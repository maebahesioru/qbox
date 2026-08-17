FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# dangerouslyAllowAllBuilds: pnpm 11.2.2でonlyBuiltDependenciesが効かずunrs-resolverがブロックされる問題の回避(2026-08-17実証)
RUN corepack enable && pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
# @swc/helpers等がstandaloneに含まれない問題の回避(Next 16+pnpm・2026-08-17実証): node_modules全体をコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
