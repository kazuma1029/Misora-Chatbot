FROM node:20 AS builder

WORKDIR /src

COPY server/package.json server/package-lock.json ./server/
COPY web/package.json web/package-lock.json ./web/

RUN npm --prefix server ci
RUN npm --prefix web ci

COPY server/ ./server/
COPY web/ ./web/

RUN npm --prefix server run build && \
    npm --prefix web run build && \
    npm --prefix server prune --production

FROM node:20 AS runner

RUN apt-get update && apt-get install -y \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /src/server/dist ./dist/
COPY --from=builder /src/server/node_modules ./node_modules/
COPY --from=builder /src/web/dist ./public/

ENV NODE_ENV=production \
    PORT=5174 \
    HOST=0.0.0.0 \
    NODE_OPTIONS=--enable-source-maps

CMD ["node", "dist/server.js"]
