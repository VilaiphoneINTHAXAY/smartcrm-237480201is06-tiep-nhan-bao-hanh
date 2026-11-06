// migrate.js – Dựng CSDL từ trạng thái trống: chạy migrations/ rồi seeds/.
// Chạy: npm run migrate   (chạy lại lần hai không lỗi, không nhân đôi dữ liệu)
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('./db');
const { hashMatKhau } = require('./security/password');

// Tệp trong migrations/ chỉ chạy MỘT lần cho mỗi CSDL: tên tệp đã chạy được ghi vào bảng schema_migration.
// (Cần thiết từ 002 trở đi vì ALTER TABLE không chạy lại được.) 001 dùng IF NOT EXISTS nên CSDL cũ
// chưa có bảng schema_migration chạy lại 001 vẫn an toàn.
function runMigrations(db, folder, quiet) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migration (
             file TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`);
  const daChay = new Set(db.prepare('SELECT file FROM schema_migration').all().map((r) => r.file));
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (daChay.has(file)) {
      if (!quiet) console.log(`  · migrations/${file} (đã chạy trước đó)`);
      continue;
    }
    try {
      db.exec(fs.readFileSync(path.join(folder, file), 'utf8'));
    } catch (err) {
      // Lỗi giữa chừng: huỷ phần đã làm và bật lại khoá ngoại, rồi báo lỗi (không ghi là đã chạy).
      try { db.exec('ROLLBACK'); } catch { /* không có giao dịch nào đang mở */ }
      db.exec('PRAGMA foreign_keys = ON');
      throw err;
    }
    db.prepare('INSERT INTO schema_migration (file) VALUES (?)').run(file);
    if (!quiet) console.log(`  ✔ migrations/${file}`);
  }
}

// Tệp trong seeds/ chạy MỖI lần: mọi lệnh đều INSERT OR IGNORE nên không nhân đôi dữ liệu (C5).
function runSeeds(db, folder, quiet) {
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    db.exec(fs.readFileSync(path.join(folder, file), 'utf8'));
    if (!quiet) console.log(`  ✔ seeds/${file}`);
  }
}

// Đặt mật khẩu DEMO cho tài khoản mẫu (BUG-006): băm trong JS với salt ngẫu nhiên RIÊNG cho từng tài khoản,
// thay cho seeds/002_demo_password.sql cũ (một chuỗi băm cố định, dùng chung salt 'mekong-demo-salt').
// Chỉ đụng tới dòng còn mật khẩu tạm 'chua-dat' hoặc còn chuỗi băm cũ -> chạy lại lần hai không đổi gì (C5).
const MAT_KHAU_DEMO = process.env.DEMO_PASSWORD || 'Demo@123';
function datMatKhauDemo(db, quiet) {
  const canDat = db.prepare(
    "SELECT id FROM app_user WHERE password_hash = 'chua-dat' OR password_hash LIKE 'scrypt$mekong-demo-salt$%'").all();
  const capNhat = db.prepare('UPDATE app_user SET password_hash = ? WHERE id = ?');
  for (const { id } of canDat) capNhat.run(hashMatKhau(MAT_KHAU_DEMO), id);
  if (!quiet) console.log(`  ✔ mật khẩu demo: đặt cho ${canDat.length} tài khoản (salt riêng từng tài khoản)`);
}

function migrate(db, { quiet = false } = {}) {
  const root = path.join(__dirname, '..', '..');   // thư mục gốc của repo
  runMigrations(db, path.join(root, 'migrations'), quiet);
  runSeeds(db, path.join(root, 'seeds'), quiet);
  datMatKhauDemo(db, quiet);
}

if (require.main === module) {
  const db = openDb();
  console.log('Đang dựng CSDL…');
  migrate(db);
  for (const t of ['app_user', 'customer', 'device', 'issue_category', 'ticket', 'ticket_status_log']) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
    console.log(`  ${t.padEnd(18)} ${n} dòng`);
  }
  db.close();
}

module.exports = { migrate };
