# Dockerfile – Giao diện React (Vite). Giai đoạn 1 build ra tệp tĩnh; giai đoạn 2 phục vụ bằng nginx.
FROM node:24-alpine AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
# Địa chỉ API mà TRÌNH DUYỆT gọi tới (cổng của dịch vụ app mở ra máy chủ) – Vite gắn vào lúc build
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 80
