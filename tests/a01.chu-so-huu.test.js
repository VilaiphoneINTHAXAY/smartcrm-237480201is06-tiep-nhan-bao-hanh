// a01.chu-so-huu.test.js – BT3 · Kiểm soát truy cập theo chủ sở hữu (OWASP A01:2025, mục S2 đề BT3).
// Tiền điều kiện dựng bằng code: CSDL trong bộ nhớ + migrate + seed (nv01, nv02 là nhân viên tiếp nhận; ql01 là Quản lý).
// Quy tắc kiểm: chỉ NGƯỜI TẠO phiếu (created_by) hoặc Quản lý được sửa / huỷ phiếu.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const { buildApp } = require('../src/backend/app');

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

async function goi(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
const dangNhap = async (username) =>
  (await goi('/api/auth/login', { method: 'POST', body: { username, password: 'Demo@123' } })).body.data.token;
const docPhieu = (id) => db.prepare('SELECT issue_description, status FROM ticket WHERE id = ?').get(id);

// nv01 tạo một phiếu mới cho thiết bị chưa có phiếu nào (seeds/003)
async function nv01TaoPhieu(token) {
  const khach = (await goi('/api/customers?phone=0901234567', { token })).body.data;
  const r = await goi('/api/tickets', { method: 'POST', token,
    body: { customerId: khach.id, deviceId: khach.devices[0].id, issueDescription: 'Màn hình bị sọc xanh' } });
  assert.equal(r.status, 201);
  return r.body.data.id;
}

test('TC-11 A01: nhân viên KHÁC (nv02) sửa hoặc huỷ phiếu của nv01 -> 403, phiếu không đổi', async () => {
  const nv01 = await dangNhap('nv01');
  const nv02 = await dangNhap('nv02');
  const id = await nv01TaoPhieu(nv01);

  const sua = await goi(`/api/tickets/${id}`, { method: 'PUT', token: nv02, body: { issueDescription: 'Đã bị sửa' } });
  assert.equal(sua.status, 403);
  assert.equal(sua.body.error, 'KHONG_DU_QUYEN');

  const huy = await goi(`/api/tickets/${id}`, { method: 'DELETE', token: nv02, body: { note: 'Huỷ thử' } });
  assert.equal(huy.status, 403);
  assert.equal(huy.body.error, 'KHONG_DU_QUYEN');

  // tác dụng phụ: dữ liệu trong CSDL KHÔNG bị đổi
  assert.deepEqual({ ...docPhieu(id) }, { issue_description: 'Màn hình bị sọc xanh', status: 'MOI' });
});

test('TC-11b A01 (luồng đúng): người tạo phiếu (nv01) và Quản lý (ql01) vẫn sửa được', async () => {
  const nv01 = await dangNhap('nv01');
  const ql01 = await dangNhap('ql01');
  const khach = (await goi('/api/customers?phone=0912345678', { token: nv01 })).body.data;
  const tao = await goi('/api/tickets', { method: 'POST', token: nv01,
    body: { customerId: khach.id, deviceId: khach.devices[0].id, issueDescription: 'Máy bị treo logo' } });
  assert.equal(tao.status, 201);
  const id = tao.body.data.id;

  const chuSua = await goi(`/api/tickets/${id}`, { method: 'PUT', token: nv01, body: { issueDescription: 'Máy bị treo logo khi khởi động' } });
  assert.equal(chuSua.status, 200);
  const qlSua = await goi(`/api/tickets/${id}`, { method: 'PUT', token: ql01, body: { issueDescription: 'Máy bị treo logo, đã thử sạc' } });
  assert.equal(qlSua.status, 200);
  assert.equal(docPhieu(id).issue_description, 'Máy bị treo logo, đã thử sạc');
});

test('A01 hồi quy (BUG-005): nhân viên khác đổi trạng thái phiếu của nv01 -> 403, trạng thái giữ MOI', async () => {
  const nv01 = await dangNhap('nv01');
  const nv02 = await dangNhap('nv02');
  const khach = (await goi('/api/customers?phone=0987654321', { token: nv01 })).body.data;
  const tao = await goi('/api/tickets', { method: 'POST', token: nv01,
    body: { customerId: khach.id, deviceId: khach.devices[0].id, issueDescription: 'Loa rè' } });
  assert.equal(tao.status, 201);
  const r = await goi(`/api/tickets/${tao.body.data.id}/status`, { method: 'PATCH', token: nv02, body: { status: 'DA_PHAN_CONG' } });
  assert.equal(r.status, 403);
  assert.equal(r.body.error, 'KHONG_DU_QUYEN');
  assert.equal(docPhieu(tao.body.data.id).status, 'MOI');
});

test('TC-11c A01 (BUG-007): nhân viên khác xem phiếu của nv01 -> không có bước chuyển nào, canEdit = false (M3 không hiện nút)', async () => {
  const nv01 = await dangNhap('nv01');
  const nv02 = await dangNhap('nv02');
  const ql01 = await dangNhap('ql01');
  const khach = (await goi('/api/customers?phone=0901234567', { token: nv01 })).body.data;
  // thiết bị mới riêng cho test này (ba máy mẫu đã có phiếu mở từ các test trên)
  const tao = await goi('/api/tickets', { method: 'POST', token: nv01, body: { issueDescription: 'Camera bị mờ',
    device: { customerId: khach.id, modelName: 'Samsung Galaxy S23', serialNo: 'TC11CSN001', purchaseDate: '2026-05-01' } } });
  assert.equal(tao.status, 201);
  const id = tao.body.data.id;

  // người KHÔNG có quyền sửa: API không được gợi ý nút nào cho giao diện
  const xemNv02 = (await goi(`/api/tickets/${id}`, { token: nv02 })).body.data;
  assert.deepEqual(xemNv02.allowedNextStatuses, []);
  assert.equal(xemNv02.canEdit, false);
  const dongTrongDanhSach = (await goi('/api/tickets', { token: nv02 })).body.data.find((p) => p.id === id);
  assert.deepEqual(dongTrongDanhSach.allowedNextStatuses, []);

  // người tạo phiếu và Quản lý vẫn thấy đủ bước chuyển (QT-06)
  const xemNv01 = (await goi(`/api/tickets/${id}`, { token: nv01 })).body.data;
  assert.deepEqual(xemNv01.allowedNextStatuses, ['DA_PHAN_CONG', 'DA_HUY']);
  assert.equal(xemNv01.canEdit, true);
  const xemQl = (await goi(`/api/tickets/${id}`, { token: ql01 })).body.data;
  assert.deepEqual(xemQl.allowedNextStatuses, ['DA_PHAN_CONG', 'DA_HUY']);
  assert.equal(xemQl.canEdit, true);
});
