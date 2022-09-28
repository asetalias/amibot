FROM node:18-alpine

WORKDIR /app

#RUN npm install --location=global yarn

COPY package.json yarn.lock ./

RUN yarn install --prod

COPY . .

CMD ["yarn", "fastify", "start", "-a", "::", "-l", "info", "app.js"]

