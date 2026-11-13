// server.js – Điểm khởi động: kiểm cấu hình, mở CSDL, dựng app, lắng nghe cổng.
const { docCauHinh } = require('./config');
const { openDb } = require('./db');
const { buildApp } = require('./app');

let cauHinh;
try {
  cauHinh = docCauHinh();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const db = openDb(cauHinh.dbPath);
buildApp(db, { sessionTimeoutMinutes: cauHinh.sessionTimeoutMinutes }).listen(cauHinh.port, () => {
  console.log(`API đang chạy tại http://localhost:${cauHinh.port}`);
});
