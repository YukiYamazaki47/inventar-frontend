# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2) Runtime stage (static server)
FROM nginx:1.27-alpine
# remove default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

# add our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
