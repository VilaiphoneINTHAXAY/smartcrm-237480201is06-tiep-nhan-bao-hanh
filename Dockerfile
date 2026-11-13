# Dockerfile – API backend (Express 5 + SQLite qua module có sẵn node:sqlite). Thành phần 4 của BT3.
# Node >= 22.13 vì node:sqlite – KHÔNG dùng node:20 như ví dụ của bài giảng (TD-12).
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    DB_PATH=/app/data/smartcrm.db

# 1. Tệp khoá trước -> chỉ cài lại thư viện khi package-lock.json đổi (tận dụng cache khi build lại)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 2. Mã nguồn, migration, dữ liệu mẫu và bộ test (giảng viên chạy npm test TRONG container)
COPY src/backend ./src/backend
COPY migrations ./migrations
COPY seeds ./seeds
COPY tests ./tests

# 3. Thư mục CSDL thuộc người dùng node; volume gắn vào đây kế thừa quyền này
RUN mkdir -p /app/data && chown -R node:node /app/data

# 4. Không chạy bằng root
USER node
EXPOSE 3000

# Mỗi lần khởi động: migrate (idempotent – lần hai không nhân đôi dữ liệu, C8) rồi mở API.
# Dùng sh -c thay vì tệp .sh để không gặp lỗi xuống dòng CRLF khi clone trên Windows.
CMD ["sh", "-c", "node src/backend/migrate.js && node src/backend/server.js"]
