# syntax=docker/dockerfile:1
# ==============================================================================
# TimeDrift Next.js Application Production Dockerfile
# Stage: deps -> builder -> runner
# Architecture: node:22-alpine, non-root user (nodejs:nodejs UID 1001)
# ==============================================================================

# Stage 1: Dependencies cache
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client, pre-build seed scene bundles & pre-seeded SQLite DB, then build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN mkdir -p /app/data /app/storage && \
    DATABASE_URL="file:/app/data/timedrift.db" npx prisma migrate deploy && \
    DATABASE_URL="file:/app/data/timedrift.db" npx tsx prisma/seed.ts && \
    npx tsx scripts/build-seeds.ts
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies:
# - curl (for health checks)
# - openssl (required by Prisma query engine on Alpine)
# - chromium and fonts (for BE-6 headless scene validation via Playwright)
RUN apk add --no-cache \
    curl \
    openssl \
    libc6-compat \
    sqlite \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser

# Create non-root system user & group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create required volume mount directories and set ownership
RUN mkdir -p /app/data /app/storage /app/public /app/seed-snapshot/storage /app/scripts && \
    chown -R nextjs:nodejs /app/data /app/storage /app/public /app/seed-snapshot /app/scripts

# Copy standalone build output, static files, and pre-built seed snapshot
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/vendor ./vendor
COPY --from=builder --chown=nextjs:nodejs /app/seed ./seed
COPY --from=builder --chown=nextjs:nodejs /app/src/types ./src/types
COPY --from=builder --chown=nextjs:nodejs /app/src/server/prompts ./src/server/prompts
COPY --from=builder --chown=nextjs:nodejs /app/data/timedrift.db ./seed-snapshot/timedrift.db
COPY --from=builder --chown=nextjs:nodejs /app/storage ./seed-snapshot/storage
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x /app/scripts/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
