# syntax=docker/dockerfile:1

# --- Build stage: produce the static production bundle ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Empty value on purpose: the browser calls same-origin "/api/*", which the
# nginx container proxies to the backend over the internal Docker network.
ENV VITE_API_URL=""
RUN npm run build

# --- Serve stage: nginx serves the bundle and proxies the API ---
FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
