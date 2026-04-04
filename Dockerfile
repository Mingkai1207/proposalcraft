# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack
RUN npm i -g corepack@latest && corepack enable

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Skip Puppeteer Chromium download during install (we use system Chrome at runtime)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN corepack prepare --activate && pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build: Vite (frontend) + esbuild (server)
RUN pnpm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-slim

# Install Chromium + required system libs for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Enable pnpm
RUN npm i -g corepack@latest && corepack enable

# Copy manifests + patches for production install
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

RUN corepack prepare --activate && pnpm install --frozen-lockfile

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway injects PORT env var)
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
