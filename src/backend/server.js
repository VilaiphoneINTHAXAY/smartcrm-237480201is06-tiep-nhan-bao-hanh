// server.js – Điểm khởi động: mở CSDL, dựng app, lắng nghe cổng.
const { openDb } = require('./db');
const { buildApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const db = openDb();
buildApp(db).listen(PORT, () => {
  console.log(`API đang chạy tại http://localhost:${PORT}`);
});
