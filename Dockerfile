FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/
COPY widget/ ./widget/
COPY vite.config.ts ./
COPY asset/ ./asset/

RUN npm run build

RUN npm run widget:build

FROM nginx:alpine

COPY --from=builder /app/dist-widget /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]