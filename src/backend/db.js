// db.js – Mở kết nối SQLite dùng chung cho cả ứng dụng.
// Dùng module có sẵn của Node (node:sqlite), không cần cài thêm thư viện.
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function openDb(dbPath = process.env.DB_PATH || 'data/smartcrm.db') {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });   // tạo thư mục data/ nếu chưa có
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');   // SQLite mặc định TẮT khóa ngoại, phải bật
  return db;
}

module.exports = { openDb };
