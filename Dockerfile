# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Production-only install, used just for its node_modules -- avoids shipping
# devDependencies (eslint, typescript, tailwind, prisma CLI, ...) in the runtime
# image while still getting the mariadb driver's full untraced dependency tree
# (see runner stage comment for why that matters).
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

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
# Next.js standalone tracing (@vercel/nft) misses transitive deps of the mariadb driver
# that it only requires lazily (denque -> iconv-lite -> safer-buffer, and more found by
# trial). Copying full node_modules from builder fixed it but bloated the image enough
# to blow past the deploy action's pull timeout. Use the prod-only install instead
# (small, no devDependencies, still has mariadb's complete tree), then layer the
# generated Prisma client from builder on top (prod-deps only has the ungenerated
# @prisma/client package skeleton).
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
