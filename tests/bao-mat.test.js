// bao-mat.test.js – BT3 · Minh chứng tự động cho checklist bảo mật (docs/checklist-bao-mat.md).
// Mục 5: lỗi không lộ chi tiết bên trong · Mục 6: log không ghi mật khẩu/token · cấu hình sai thì dừng.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const { buildApp } = require('../src/backend/app');
const { docCauHinh } = require('../src/backend/config');
const { che, dongLogLoi } = require('../src/backend/security/log');

let server;
let base;
let db;
before(async () => {
  db = openDb(':memory:');
  migrate(db, { quiet: true });
  server = buildApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function goi(path, { method = 'GET', token, raw, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, headers: res.headers, text: await res.text() };
}

// Dấu vết nội bộ không được xuất hiện trong thân lỗi trả về
const DAU_VET = /at \w+ \(|node_modules|\.js:\d+|SQLITE|sqlite|SELECT |FROM |app_user|ticket_status_log|stack/;

test('Mục 5: JSON hỏng -> 400 mã nghiệp vụ, không lộ stack trace / thư viện', async () => {
  const r = await goi('/api/auth/login', { method: 'POST', raw: '{"username":"nv01","password":' });
  assert.equal(r.status, 400);
  assert.equal(JSON.parse(r.text).error, 'DU_LIEU_KHONG_HOP_LE');
  assert.doesNotMatch(r.text, DAU_VET);
});

test("Mục 2+5: id kiểu tiêm SQL ('1 OR 1=1') -> 404 KHONG_TIM_THAY, không lộ SQL", async () => {
  const login = JSON.parse((await goi('/api/auth/login', { method: 'POST', body: { username: 'nv01', password: 'Demo@123' } })).text);
  const r = await goi('/api/tickets/1%20OR%201=1', { token: login.data.token });
  assert.equal(r.status, 404);
  assert.equal(JSON.parse(r.text).error, 'KHONG_TIM_THAY');
  assert.doesNotMatch(r.text, DAU_VET);
});

test('Mục 5: header phản hồi không có X-Powered-By', async () => {
  const r = await goi('/health');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('Mục 5+6: CSDL hỏng -> /health 503, API 500 thông báo chung; log không chứa mật khẩu/token', async () => {
  const login = JSON.parse((await goi('/api/auth/login', { method: 'POST', body: { username: 'nv01', password: 'Demo@123' } })).text);
  const token = login.data.token;
  const log = [];
  const goc = console.error;
  console.error = (...a) => log.push(a.join(' '));
  try {
    db.close();   // mô phỏng CSDL ngừng hoạt động
    const h = await goi('/health');
    assert.equal(h.status, 503);
    assert.deepEqual(JSON.parse(h.text), { status: 'error', db: 'down' });

    const r = await goi('/api/tickets', { method: 'POST', token,
      body: { customerId: 1, deviceId: 1, issueDescription: 'Demo@123 mật khẩu lọt vào thân?' } });
    assert.equal(r.status, 500);
    assert.deepEqual(JSON.parse(r.text), { error: 'LOI_HE_THONG', message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
    assert.doesNotMatch(r.text, DAU_VET);
  } finally {
    console.error = goc;
  }
  const tatCa = log.join('\n');
  assert.ok(log.length >= 1, 'lỗi 500 phải được ghi log');
  assert.ok(!tatCa.includes(token), 'log không được chứa token');
  assert.ok(!tatCa.includes('Demo@123'), 'log không được chứa thân request / mật khẩu');
  assert.ok(!tatCa.includes('Bearer'), 'log không được chứa header Authorization');
});

test('Mục 6: che() thay mọi khóa nhạy cảm bằng ***', () => {
  const ra = che({ username: 'nv01', password: 'x', nested: { token: 't', Authorization: 'Bearer t' }, list: [{ matKhau: 'y' }] });
  assert.deepEqual(ra, { username: 'nv01', password: '***', nested: { token: '***', Authorization: '***' }, list: [{ matKhau: '***' }] });
});

test('Mục 6: dongLogLoi() bỏ query string (phòng token trên URL)', () => {
  const dong = JSON.parse(dongLogLoi(new Error('x'), { method: 'GET', originalUrl: '/api/tickets?token=abc' }));
  assert.equal(dong.path, '/api/tickets');
  assert.ok(!JSON.stringify(dong).includes('abc'));
});

test("Cấu hình: FRONTEND_ORIGIN='*' hoặc PORT sai -> dừng với thông báo rõ", () => {
  assert.throws(() => docCauHinh({ FRONTEND_ORIGIN: '*' }), /FRONTEND_ORIGIN không được là '\*'/);
  assert.throws(() => docCauHinh({ PORT: 'abc' }), /PORT/);
  assert.throws(() => docCauHinh({ FRONTEND_ORIGIN: 'http://localhost:5173/' }), /không hợp lệ/);
  const ok = docCauHinh({ FRONTEND_ORIGIN: 'http://localhost:5173, http://localhost:8080' });
  assert.deepEqual(ok.frontendOrigins, ['http://localhost:5173', 'http://localhost:8080']);
  assert.equal(ok.port, 3000);
});
