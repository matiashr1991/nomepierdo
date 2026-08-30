# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Next.js standalone tracing (@vercel/nft) misses these because the mariadb driver
# requires them lazily, not statically. Full dependency closure verified locally
# (mariadb -> denque, iconv-lite -> safer-buffer, lru-cache -> yallist): ~5MB total,
# not worth a whole extra node_modules copy (that approach bloated the image enough
# to blow past the deploy pull timeout -- these 6 packages are the actual fix).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/mariadb ./node_modules/mariadb
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/denque ./node_modules/denque
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/iconv-lite ./node_modules/iconv-lite
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/lru-cache ./node_modules/lru-cache
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/safer-buffer ./node_modules/safer-buffer
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/yallist ./node_modules/yallist

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
