# =============================================================================
# Multi-stage Dockerfile for RRent Backend (NestJS + pnpm + Prisma)
# =============================================================================
# Architecture: base -> deps -> build -> runtime
# Base Image: node:20-slim (avoids Prisma + alpine compatibility issues)
# Package Manager: pnpm (via corepack)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base - Setup Node.js environment and enable pnpm
# -----------------------------------------------------------------------------
FROM node:20-slim AS base

# Enable corepack for pnpm support
RUN corepack enable

# Install OpenSSL (required for Prisma)
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set pnpm store directory
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


# -----------------------------------------------------------------------------
# Stage 2: Dependencies - Install production dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy only dependency-related files for better caching
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies with frozen lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm prisma generate


# -----------------------------------------------------------------------------
# Stage 3: Build - Compile TypeScript to JavaScript
# -----------------------------------------------------------------------------
FROM base AS build

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code and build configuration
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json ./

# Build the application
RUN pnpm run build

# Prune dev dependencies (install only production dependencies)
RUN pnpm install --prod --frozen-lockfile


# -----------------------------------------------------------------------------
# Stage 4: Runtime - Final production image
# -----------------------------------------------------------------------------
FROM node:20-slim AS runtime

# Install OpenSSL (required for Prisma at runtime)
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy production dependencies from build stage
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary files for runtime
COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml ./
COPY --chown=nodejs:nodejs prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check (adjust endpoint based on your actual health route)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/ready', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "dist/main"]
