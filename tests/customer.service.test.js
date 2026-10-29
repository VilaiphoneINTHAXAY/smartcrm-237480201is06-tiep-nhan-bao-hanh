// customer.service.test.js – Kiểm thử lớp service với CSDL trong bộ nhớ (không phụ thuộc máy em).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { openDb } = require('../src/backend/db');
const { migrate } = require('../src/backend/migrate');
const CustomerRepository = require('../src/backend/repositories/customer.repository');
const CustomerService = require('../src/backend/services/customer.service');

function newService() {
  const db = openDb(':memory:');
  migrate(db, { quiet: true });
  return new CustomerService(new CustomerRepository(db));
}

test('Luồng đúng: tạo khách hàng mới rồi tra cứu lại được theo SĐT (FR-01, FR-02)', () => {
  const service = newService();
  const created = service.create({ fullName: 'Nguyễn Văn Test', phone: '0909000111' });
  const found = service.findByPhone('0909000111');
  assert.equal(found.id, created.id);
  assert.equal(found.full_name, 'Nguyễn Văn Test');
  assert.deepEqual(found.devices, []);
});

test('Dữ liệu sai: SĐT sai định dạng bị từ chối, báo đúng tên trường', () => {
  const service = newService();
  assert.throws(
    () => service.create({ fullName: 'Khách A', phone: '12345' }),
    (err) => err.code === 'DU_LIEU_KHONG_HOP_LE' && err.field === 'phone'
  );
});

test('Quy tắc BR-07: một SĐT không được thuộc hai khách hàng', () => {
  const service = newService();
  // '0901234567' đã có trong dữ liệu mẫu (Lê Cường)
  assert.throws(
    () => service.create({ fullName: 'Người khác', phone: '0901234567' }),
    (err) => err.code === 'TRUNG_DU_LIEU'
  );
});

// ---------- Bổ sung theo case study (TD-07) ----------
const QL = { id: 2, role: 'QUAN_LY' };
const NV = { id: 1, role: 'TIEP_NHAN' };

test('QT-02: lưu SĐT ở dạng chuẩn và tra cứu được bằng dạng +84 có dấu cách', () => {
  const service = newService();
  const created = service.create({ fullName: 'Khách +84', phone: '+84 909 000 222' }, QL);
  assert.equal(created.phone, '0909000222');
  assert.equal(service.findByPhone('0909.000.222', QL).id, created.id);
  // QT-01/BR-07: nhập dạng khác của cùng số vẫn bị coi là trùng
  assert.throws(() => service.create({ fullName: 'Trùng', phone: '84909000222' }), { code: 'TRUNG_DU_LIEU' });
});

test('QT-13: xoá khách = ngừng sử dụng, không xoá vật lý; SĐT vẫn không cấp lại cho người khác', () => {
  const service = newService();
  const k = service.create({ fullName: 'Khách tạm', phone: '0909000333' });
  service.remove(k.id);
  assert.throws(() => service.getById(k.id), { code: 'KHONG_TIM_THAY' });
  assert.throws(() => service.create({ fullName: 'Người khác', phone: '0909000333' }), { code: 'TRUNG_DU_LIEU' });
});

test('QT-15: tra cứu bằng tài khoản nhân viên trả SĐT đã che', () => {
  const service = newService();
  assert.equal(service.findByPhone('0901234567', NV).phone, '090****567');
  assert.equal(service.findByPhone('0901234567', QL).phone, '0901234567');
});

