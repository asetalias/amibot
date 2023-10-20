FROM oven/bun:alpine as builder

WORKDIR /home/bun/app

COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun build:ts

FROM oven/bun:alpine

ENV NODE_ENV production
USER node

WORKDIR /home/bun/app
COPY --from=builder /home/bun/app/package.json /home/bun/app/bun.lockb ./
RUN yarn install --frozen-lockfile --production
COPY --from=builder /home/bun/app/dist ./dist

CMD ["bun", "run", "fastify", "start", "-a", "::", "-l", "info", "dist/app.js"]
