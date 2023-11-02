FROM oven/bun:alpine as builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .

FROM oven/bun:alpine

ENV NODE_ENV production
USER node

WORKDIR /app
COPY --from=builder /app/package.json /app/bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist

CMD ["bun", "start"]
