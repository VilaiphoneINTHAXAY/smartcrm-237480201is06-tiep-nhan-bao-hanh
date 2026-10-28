// auth.service.test.js – Phiên hết hạn sau 30 phút KHÔNG hoạt động (NFR-06), kiểm bằng đồng hồ giả.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const UserRepository = require('../src/backend/repositories/user.repository');
const AuthService = require('../src/backend/services/auth.service');

test('NFR-06 giá trị biên: 30 phút đúng vẫn còn phiên; quá 30 phút không hoạt động -> CHUA_DANG_NHAP', () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  let gio = 0;
  const auth = new AuthService(new UserRepository(db), { timeoutMinutes: 30, now: () => gio });
  const { token } = auth.login('ql01', 'Demo@123');
  gio += 30 * 60 * 1000;                       // đúng 30 phút
  assert.equal(auth.verify(token).username, 'ql01');
  gio += 30 * 60 * 1000 + 1;                   // 30 phút 0,001 giây kể từ lần dùng trước
  assert.throws(() => auth.verify(token), { code: 'CHUA_DANG_NHAP' });
});
