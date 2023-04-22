FROM node:18-alpine as builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build:ts

FROM node:slim

ENV NODE_ENV production
USER node

WORKDIR /app
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist

CMD ["yarn", "fastify", "start", "-a", "::", "-l", "info", "dist/app.js"]

