// api.test.js – Kiểm thử qua HTTP thật: đăng nhập (NFR-06), mã lỗi 401/403/400 và định dạng lỗi thống nhất.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const { buildApp } = require('../src/backend/app');

let server;
let base;
before(async () => {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  server = buildApp(db).listen(0); // cổng ngẫu nhiên, không đụng server đang chạy của em
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function goi(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
}
const dangNhap = async (username) =>
  (await goi('/api/auth/login', { method: 'POST', body: { username, password: 'Demo@123' } })).body.data.token;

test('NFR-06: chưa đăng nhập gọi API nghiệp vụ -> 401 CHUA_DANG_NHAP', async () => {
  const r = await goi('/api/tickets');
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'CHUA_DANG_NHAP');
});

test('NFR-06: sai mật khẩu -> 401, không lộ tên đăng nhập có tồn tại hay không', async () => {
  const r = await goi('/api/auth/login', { method: 'POST', body: { username: 'nv01', password: 'sai' } });
  assert.equal(r.status, 401);
  assert.equal(r.body.message, 'Sai tên đăng nhập hoặc mật khẩu');
});

test('Luồng API: nhân viên tạo phiếu (201); duyệt bảo hành bằng vai trò nhân viên -> 403', async () => {
  const nv = await dangNhap('nv01');
  const khach = (await goi('/api/customers?phone=0987654321', { token: nv })).body.data;
  const mayChuaCoNgayMua = khach.devices[0]; // seeds/003: Redmi Note 13 không có ngày mua
  const tao = await goi('/api/tickets', { method: 'POST', token: nv,
    body: { deviceId: mayChuaCoNgayMua.id, issueDescription: 'Máy không lên nguồn' } });
  assert.equal(tao.status, 201);
  assert.equal(tao.body.data.warrantyStatus, 'CHUA_XAC_MINH');
  const duyet = await goi(`/api/tickets/${tao.body.data.id}/approve`, { method: 'POST', token: nv });
  assert.equal(duyet.status, 403);
  assert.equal(duyet.body.error, 'KHONG_DU_QUYEN');
});

test('C7: dữ liệu sai -> 400 kèm fields theo tên trường, không phải lỗi thô 500', async () => {
  const nv = await dangNhap('nv01');
  const r = await goi('/api/tickets', { method: 'POST', token: nv, body: { deviceId: 1, issueDescription: '' } });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.fields, { issueDescription: 'Vui lòng nhập mô tả lỗi' });
});
