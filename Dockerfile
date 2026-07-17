# Build stage
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage — Next.js standalone output
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Starter dataset — the SQLite db is created next to it at runtime
# (mount ./data as a volume so the database survives container rebuilds)
COPY --from=builder /app/data/starter-fragrances.json ./data/starter-fragrances.json

EXPOSE 3000
CMD ["node", "server.js"]
