# syntax=docker/dockerfile:1

# --- Build stage: install all deps and compile TypeScript -> dist/ ---
# Debian-slim (glibc) rather than alpine (musl): the TypeScript compiler ships a
# native binary and glibc is the safe target for it.
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage: production deps + compiled output only ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
