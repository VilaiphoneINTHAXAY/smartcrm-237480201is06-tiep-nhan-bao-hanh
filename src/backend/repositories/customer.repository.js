// customer.repository.js – Lớp 4: nơi DUY NHẤT viết SQL cho bảng customer.
// Không chứa quy tắc nghiệp vụ, chỉ đọc/ghi dữ liệu. Mọi câu SQL đều tham số hoá (?).
class CustomerRepository {
  constructor(db) {
    this.db = db;
  }

  // Mặc định chỉ lấy khách còn hoạt động (QT-13: khách "đã xoá" chỉ bị đánh dấu is_active = 0).
  findAll() {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer WHERE is_active = 1 ORDER BY id').all();
  }

  findById(id) {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer WHERE id = ? AND is_active = 1').get(id);
  }

  findByPhone(phone) {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer WHERE phone = ? AND is_active = 1').get(phone);
  }

  // Kể cả khách đã ngừng sử dụng: SĐT vẫn là duy nhất trong hệ thống (QT-01, BR-07).
  phoneExists(phone) {
    return this.db.prepare('SELECT id FROM customer WHERE phone = ?').get(phone);
  }

  create({ fullName, phone }) {
    const r = this.db.prepare('INSERT INTO customer (full_name, phone) VALUES (?, ?)').run(fullName, phone);
    return this.findById(Number(r.lastInsertRowid));
  }

  update(id, { fullName, phone }) {
    this.db.prepare(
      'UPDATE customer SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?'
    ).run(fullName ?? null, phone ?? null, id);
    return this.findById(id);
  }

  // QT-13: không xoá vật lý, chỉ đánh dấu ngừng sử dụng; lịch sử phiếu vẫn giữ nguyên.
  deactivate(id) {
    return this.db.prepare('UPDATE customer SET is_active = 0 WHERE id = ?').run(id).changes;
  }

  countDevices(customerId) {
    return this.db.prepare('SELECT COUNT(*) AS n FROM device WHERE customer_id = ?').get(customerId).n;
  }

  findDevices(customerId) {
    return this.db.prepare(
      'SELECT id, model_name, imei, serial_no, purchase_date, warranty_months FROM device WHERE customer_id = ? ORDER BY id'
    ).all(customerId);
  }
}

module.exports = CustomerRepository;
