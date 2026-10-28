// customer.repository.js – Lớp 4: nơi DUY NHẤT viết SQL cho bảng customer.
// Không chứa quy tắc nghiệp vụ, chỉ đọc/ghi dữ liệu. Mọi câu SQL đều tham số hoá (?).
class CustomerRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer ORDER BY id').all();
  }

  findById(id) {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer WHERE id = ?').get(id);
  }

  findByPhone(phone) {
    return this.db.prepare('SELECT id, full_name, phone, created_at FROM customer WHERE phone = ?').get(phone);
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

  remove(id) {
    return this.db.prepare('DELETE FROM customer WHERE id = ?').run(id).changes;
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
