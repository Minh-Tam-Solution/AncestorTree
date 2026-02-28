# @project AncestorTree
# @file frontend/Dockerfile
# @description Multi-stage production Dockerfile for the Next.js web app.
#              Uses standalone output mode (DOCKER_BUILD=true) for minimal image size.
#              Backup ZIPs are stored in /data/backups (mount as volume on host).
# @version 1.0.0
# @updated 2026-02-28

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Standalone mode required for production Docker (no dev server)
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time — must be ARGs.
# Pass them via docker-compose build.args (reads from .env on the host).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLAN_NAME
ARG NEXT_PUBLIC_CLAN_FULL_NAME
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CLAN_NAME=$NEXT_PUBLIC_CLAN_NAME
ENV NEXT_PUBLIC_CLAN_FULL_NAME=$NEXT_PUBLIC_CLAN_FULL_NAME

RUN pnpm build

# ─── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces inside the container
ENV HOSTNAME=0.0.0.0
ENV PORT=4000

# Least-privilege user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone build (server.js + node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets & public dir
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

# Backup volume mount point
RUN mkdir -p /data/backups && chown nextjs:nodejs /data/backups

USER nextjs

EXPOSE 4000

# node server.js is the Next.js standalone entrypoint
CMD ["node", "server.js"]
