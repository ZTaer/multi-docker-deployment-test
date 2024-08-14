## Node
FROM node:18-alpine AS builder-prod

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

## Nginx
FROM nginx

EXPOSE 3000

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder-prod /app/build /usr/share/nginx/html