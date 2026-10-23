// ticket.service.test.js – Kiểm thử luồng tạo phiếu: ghép WarrantyRule + ClassificationRule + SlaRule.
// CSDL trong bộ nhớ + đồng hồ cố định -> kết quả giống nhau trên mọi máy, không phụ thuộc dữ liệu riêng.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const TicketRepository = require('../src/backend/repositories/ticket.repository');
const DeviceRepository = require('../src/backend/repositories/device.repository');
const TicketService = require('../src/backend/services/ticket.service');

const NV = { id: 1, role: 'TIEP_NHAN' };   // nv01 trong seeds
const QL = { id: 2, role: 'QUAN_LY' };     // ql01 trong seeds
// Thứ Sáu 23/10/2026 09:00 giờ Việt Nam
const LUC = new Date('2026-10-23T09:00:00+07:00');

function setup() {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  const service = new TicketService(new TicketRepository(db), new DeviceRepository(db), () => LUC);
  const khachId = db.prepare("SELECT id FROM customer WHERE phone = '0909000999'").get()?.id
    ?? Number(db.prepare("INSERT INTO customer (full_name, phone) VALUES ('Khách Test', '0909000999')").run().lastInsertRowid);
  return { db, service, khachId };
}

const mayMoi = (khachId, extra = {}) => ({
  customerId: khachId, modelName: 'Oppo A79', imei: '490154203237518', purchaseDate: '2026-05-01', ...extra,
});

test('Luồng đúng (FR-03, 04, 07, 08): tạo phiếu -> CÒN bảo hành, nhóm Phần cứng/CAO, hạn SLA thứ Hai, có lịch sử', () => {
  const { service, khachId } = setup();
  const p = service.create({ issueDescription: 'Màn hình bị sọc xanh', device: mayMoi(khachId) }, NV);
  assert.match(p.code, /^BH-\d{6}$/);
  assert.equal(p.status, 'MOI');
  assert.equal(p.warrantyStatus, 'CON_BAO_HANH');
  assert.equal(p.categoryName, 'Phần cứng');
  assert.equal(p.priority, 'CAO');
  // Thứ Sáu 09:00 + 1 ngày làm việc = thứ Hai 26/10 09:00 (GWT-13)
  assert.equal(p.slaDueAt, new Date('2026-10-26T09:00:00+07:00').toISOString());
  const logs = service.getLogs(p.id);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].action, 'TAO_PHIEU'); // NFR-05
});

test('GWT-09 + GWT-20: thiếu ngày mua -> CHƯA XÁC MINH, gắn cờ; Quản lý duyệt -> CÒN BẢO HÀNH, bỏ cờ', () => {
  const { service, khachId } = setup();
  const p = service.create({ issueDescription: 'Máy hay bị treo', device: mayMoi(khachId, { purchaseDate: null }) }, NV);
  assert.equal(p.warrantyStatus, 'CHUA_XAC_MINH');
  assert.equal(p.isUnverified, true);
  assert.equal(service.list({ unverified: true }).length, 1);
  const duyet = service.approveWarranty(p.id, QL);
  assert.equal(duyet.warrantyStatus, 'CON_BAO_HANH');
  assert.equal(duyet.isUnverified, false);
});

test('Dữ liệu sai (GWT-05): mô tả lỗi chỉ có khoảng trắng -> từ chối, không tạo phiếu nào', () => {
  const { service, khachId } = setup();
  assert.throws(() => service.create({ issueDescription: '   ', device: mayMoi(khachId) }, NV),
    { code: 'DU_LIEU_KHONG_HOP_LE', field: 'issueDescription', message: 'Vui lòng nhập mô tả lỗi' });
  assert.equal(service.list().length, 0);
});

test('Dữ liệu sai (GWT-04): IMEI 14 chữ số -> báo lỗi tại trường imei', () => {
  const { service, khachId } = setup();
  assert.throws(() => service.create({ issueDescription: 'Mất sóng', device: mayMoi(khachId, { imei: '49015420323751' }) }, NV),
    { code: 'DU_LIEU_KHONG_HOP_LE', field: 'imei' });
});

test('GWT-08 trong giao dịch: ngày mua sau ngày tiếp nhận -> từ chối VÀ không để lại thiết bị rác', () => {
  const { db, service, khachId } = setup();
  const truoc = db.prepare('SELECT COUNT(*) AS n FROM device').get().n;
  assert.throws(() => service.create({ issueDescription: 'Loa rè', device: mayMoi(khachId, { purchaseDate: '2026-12-01' }) }, NV),
    { code: 'DU_LIEU_KHONG_HOP_LE', field: 'purchaseDate' });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM device').get().n, truoc);
});

test('BR-03 + BR-06: nhân viên tiếp nhận không được duyệt; Quản lý từ chối mà thiếu lý do bị chặn (GWT-10)', () => {
  const { service, khachId } = setup();
  const p = service.create({ issueDescription: 'Sạc không vào', device: mayMoi(khachId, { purchaseDate: null }) }, NV);
  assert.throws(() => service.approveWarranty(p.id, NV), { code: 'KHONG_DU_QUYEN' });
  assert.throws(() => service.rejectWarranty(p.id, { note: ' ' }, QL), { code: 'DU_LIEU_KHONG_HOP_LE', field: 'note' });
  const tuChoi = service.rejectWarranty(p.id, { note: 'Không có hoá đơn mua hàng' }, QL);
  assert.equal(tuChoi.isUnverified, true); // từ chối thì giữ cờ
});

test('Đổi trạng thái chỉ đi tiến từng bước: MOI -> HOAN_TAT bị từ chối, MOI -> DA_PHAN_CONG được', () => {
  const { service, khachId } = setup();
  const p = service.create({ issueDescription: 'Wifi chập chờn', device: mayMoi(khachId) }, NV);
  assert.throws(() => service.changeStatus(p.id, { status: 'HOAN_TAT' }, NV), { code: 'TRANG_THAI_KHONG_HOP_LE' });
  assert.equal(service.changeStatus(p.id, { status: 'DA_PHAN_CONG' }, NV).status, 'DA_PHAN_CONG');
});

test('Hợp đồng toTicketView: đủ trường, ngày dạng ISO, purchaseDate null khi chưa có ngày mua', () => {
  const { service, khachId } = setup();
  const p = service.create({ issueDescription: 'Ốp lưng bị nứt', device: mayMoi(khachId, { purchaseDate: null }) }, NV);
  assert.deepEqual(Object.keys(p).sort(), ['categoryName', 'code', 'customer', 'device', 'id', 'isOverdue',
    'isUnverified', 'issueDescription', 'needsAttention', 'priority', 'receivedAt', 'slaDueAt', 'status', 'warrantyStatus']);
  assert.match(p.receivedAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(p.device.purchaseDate, null);
});
