// Kiểm thử dựng CSDL (C5): chạy lại không lỗi, không nhân đôi; nâng cấp CSDL cũ (trước TD-07) không mất phiếu.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');

const goc = path.join(__dirname, '..');
const dem = (db, bang) => db.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get().n;

test('C5: chạy migrate hai lần không lỗi, số dòng giữ nguyên, mỗi migration chỉ chạy một lần', () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  const truoc = ['customer', 'device', 'issue_category', 'app_user'].map((b) => dem(db, b));
  migrate(db, { quiet: true });
  assert.deepEqual(['customer', 'device', 'issue_category', 'app_user'].map((b) => dem(db, b)), truoc);
  assert.equal(dem(db, 'schema_migration'), fs.readdirSync(path.join(goc, 'migrations')).filter((f) => f.endsWith('.sql')).length);
});

test('Nâng cấp CSDL cũ (chỉ có 001, chưa có schema_migration): giữ nguyên phiếu và lịch sử, cho phép DA_HUY', () => {
  const db = openDb(':memory:');
  // Dựng lại đúng trạng thái CSDL của em trước TD-07: chỉ chạy 001 + seeds, rồi có một phiếu kèm lịch sử.
  db.exec(fs.readFileSync(path.join(goc, 'migrations', '001_init.sql'), 'utf8'));
  for (const f of fs.readdirSync(path.join(goc, 'seeds')).filter((x) => x.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(path.join(goc, 'seeds', f), 'utf8'));
  }
  db.exec(`INSERT INTO ticket (code, device_id, category_id, created_by, issue_description, priority, status,
                               warranty_status, received_at, sla_due_at)
           VALUES ('BH-0001', 1, 1, 1, 'Màn hình sọc', 'CAO', 'MOI', 'CON_BAO_HANH',
                   '2026-10-23T02:00:00.000Z', '2026-10-24T02:00:00.000Z');
           INSERT INTO ticket_status_log (ticket_id, action, to_status, changed_by) VALUES (1, 'TAO_PHIEU', 'MOI', 1);`);

  migrate(db, { quiet: true });
  migrate(db, { quiet: true });   // lần hai: 002 không chạy lại

  assert.equal(dem(db, 'ticket'), 1);
  assert.equal(dem(db, 'ticket_status_log'), 1);           // lịch sử không bị xoá dây chuyền khi dựng lại bảng
  db.exec("UPDATE ticket SET status = 'DA_HUY' WHERE id = 1");   // CHECK mới chấp nhận DA_HUY (QT-06)
  assert.equal(db.prepare('SELECT is_active FROM customer LIMIT 1').get().is_active, 1);   // cột mới QT-13
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);                    // khoá ngoại bật lại
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});
