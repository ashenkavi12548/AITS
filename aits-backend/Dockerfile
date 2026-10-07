FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy dependency files
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma in runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 5001

# Run migrations and start app (assuming deploy fails gracefully or is handled by Railway release command, but safe to chain here for simple setups)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
