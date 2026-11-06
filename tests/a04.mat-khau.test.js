// a04.mat-khau.test.js – BT3 · Lưu mật khẩu an toàn (OWASP A04:2025 Cryptographic Failures,
// checklist bảo mật mục 4, đề BT3 mục S3). Tiền điều kiện dựng bằng code: CSDL trong bộ nhớ + migrate + seed
// (nv01, nv02, ql01 cùng mật khẩu demo Demo@123).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');

const docMatKhau = (db) => db.prepare('SELECT username, password_hash FROM app_user ORDER BY username').all();

test('A04: mật khẩu lưu dạng băm scrypt, mỗi tài khoản một salt ngẫu nhiên riêng (≥ 16 byte)', () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  const dong = docMatKhau(db);
  assert.equal(dong.length, 3);
  for (const { username, password_hash: h } of dong) {
    assert.doesNotMatch(h, /Demo@123/, `${username}: không được lưu mật khẩu đọc được`);
    const [thuatToan, salt, hash] = h.split('$');
    assert.equal(thuatToan, 'scrypt', `${username}: phải là chuỗi băm scrypt`);
    assert.match(salt, /^[0-9a-f]{32,}$/, `${username}: salt phải là ≥ 16 byte ngẫu nhiên (hex)`);
    assert.match(hash, /^[0-9a-f]{64}$/);
  }
  // Ba tài khoản CÙNG mật khẩu nhưng chuỗi băm phải KHÁC nhau
  assert.equal(new Set(dong.map((d) => d.password_hash)).size, dong.length, 'hai tài khoản trùng chuỗi băm');
});

test('A04 hồi quy (BUG-006): chạy migrate lần hai KHÔNG băm lại; đăng nhập bằng mật khẩu demo vẫn được', () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  const lan1 = docMatKhau(db);
  migrate(db, { quiet: true });
  assert.deepEqual(docMatKhau(db), lan1);
  const { dungMatKhau } = require('../src/backend/security/password');
  for (const d of lan1) assert.equal(dungMatKhau('Demo@123', d.password_hash), true);
  assert.equal(dungMatKhau('sai-mat-khau', lan1[0].password_hash), false);
});

test('A04 hồi quy (BUG-006): CSDL cũ còn chuỗi băm dùng chung salt được băm lại khi migrate', () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  const CU = 'scrypt$mekong-demo-salt$e2bec9f2ceef98bf23976140abfe254328ecfbafd1b0981c6a27ae5bc8fed869';
  db.prepare('UPDATE app_user SET password_hash = ?').run(CU);
  migrate(db, { quiet: true });
  for (const d of docMatKhau(db)) assert.notEqual(d.password_hash, CU);
});
