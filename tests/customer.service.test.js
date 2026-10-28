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
