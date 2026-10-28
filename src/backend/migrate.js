// migrate.js – Dựng CSDL từ trạng thái trống: chạy migrations/ rồi seeds/.
// Chạy: npm run migrate   (chạy lại lần hai không lỗi, không nhân đôi dữ liệu)
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('./db');

function runFolder(db, folder, quiet) {
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    db.exec(fs.readFileSync(path.join(folder, file), 'utf8'));
    if (!quiet) console.log(`  ✔ ${path.basename(folder)}/${file}`);
  }
}

function migrate(db, { quiet = false } = {}) {
  const root = path.join(__dirname, '..', '..');   // thư mục gốc của repo
  runFolder(db, path.join(root, 'migrations'), quiet);
  runFolder(db, path.join(root, 'seeds'), quiet);
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
