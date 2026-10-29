// Kiểm thử lớp service bằng REPOSITORY GIẢ (tài liệu tự học buổi 7, mục A5): không cần CSDL, chạy vài mili giây.
// Chứng minh service chỉ phụ thuộc vào "hợp đồng" của repository, không phụ thuộc SQLite.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TicketService = require('../src/backend/services/ticket.service');

const NV = { id: 1, role: 'TIEP_NHAN' };
const LUC = new Date('2026-10-23T09:00:00+07:00');

function taoService({ phieuCuaThietBi = [] } = {}) {
  const daGhi = [];
  const ticketRepo = {
    transaction: (fn) => fn(),
    findByDevice: () => phieuCuaThietBi,
    findCategories: () => [{ id: 1, name: 'Khác', keywords: '', default_priority: 'TRUNG_BINH', match_order: 99 }],
    create: (p) => { daGhi.push(p); return 1; },
    addLog: () => {},
    // Đọc lại phiếu vừa ghi: dựng một dòng giống dòng repository thật trả về
    findById: () => daGhi[0] && {
      id: 1, code: 'BH-0001', status: 'MOI', priority: daGhi[0].priority, category_name: 'Khác',
      warranty_status: daGhi[0].warrantyStatus, is_unverified: 0, issue_description: daGhi[0].issueDescription,
      received_at: daGhi[0].receivedAt, sla_due_at: daGhi[0].slaDueAt, created_by_name: 'Nguyễn An',
      customer_id: 7, customer_name: 'Khách Test', customer_phone: '0909000999', device_id: 5,
    },
  };
  const deviceRepo = {
    findById: (id) => ({ id, customer_id: 7, purchase_date: '2026-05-01', warranty_months: 12 }),
  };
  return { service: new TicketService(ticketRepo, deviceRepo, () => LUC), daGhi };
}

test('Repo giả – dữ liệu sai: thiết bị đang có phiếu MOI -> PHIEU_DANG_MO, không ghi gì xuống CSDL', () => {
  const { service, daGhi } = taoService({ phieuCuaThietBi: [{ id: 9, code: 'BH-0009', status: 'MOI' }] });
  assert.throws(() => service.create({ issueDescription: 'Máy nóng', deviceId: 5, customerId: 7 }, NV),
    (err) => err.code === 'PHIEU_DANG_MO' && err.message.includes('BH-0009'));
  assert.equal(daGhi.length, 0);
});

test('Repo giả – QT-03: thiết bị của khách 7 nhưng đang tiếp nhận khách 8 -> THIET_BI_KHONG_THUOC_KHACH', () => {
  const { service, daGhi } = taoService();
  assert.throws(() => service.create({ issueDescription: 'Máy nóng', deviceId: 5, customerId: 8 }, NV),
    { code: 'THIET_BI_KHONG_THUOC_KHACH' });
  assert.equal(daGhi.length, 0);
});

test('Repo giả – luồng đúng: phiếu cũ đã DA_HUY thì vẫn ghi được phiếu mới với hạn SLA tính sẵn', () => {
  const { service, daGhi } = taoService({ phieuCuaThietBi: [{ id: 9, code: 'BH-0009', status: 'DA_HUY' }] });
  const p = service.create({ issueDescription: 'Máy nóng', deviceId: 5, customerId: 7 }, NV);
  assert.equal(daGhi.length, 1);
  assert.equal(p.status, 'MOI');
  assert.equal(p.warrantyStatus, 'CON_BAO_HANH');
  assert.equal(p.customer.phone, '090****999');   // QT-15: nhân viên thấy số đã che
  // TRUNG_BINH = 3 ngày làm việc: thứ Sáu 23/10 -> thứ Bảy, thứ Hai, thứ Ba 27/10 (QT-04, bỏ Chủ nhật)
  assert.equal(p.slaDueAt, new Date('2026-10-27T09:00:00+07:00').toISOString());
});
