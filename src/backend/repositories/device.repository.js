// device.repository.js – Lớp 4: SQL cho bảng device. Không chứa quy tắc nghiệp vụ.
const COT = 'id, customer_id, model_name, imei, serial_no, purchase_date, warranty_months';

class DeviceRepository {
  constructor(db) {
    this.db = db;
  }

  customerExists(customerId) {
    return !!this.db.prepare('SELECT 1 FROM customer WHERE id = ?').get(customerId);
  }

  findById(id) {
    return this.db.prepare(`SELECT ${COT} FROM device WHERE id = ?`).get(id);
  }

  // BR-01: dùng để kiểm tra trùng IMEI/Serial trước khi tạo
  findByImeiOrSerial(imei, serialNo) {
    return this.db.prepare(
      `SELECT ${COT} FROM device WHERE (imei IS NOT NULL AND imei = ?) OR (serial_no IS NOT NULL AND serial_no = ?)`
    ).get(imei, serialNo);
  }

  create({ customerId, modelName, imei, serialNo, purchaseDate, warrantyMonths }) {
    const r = this.db.prepare(
      `INSERT INTO device (customer_id, model_name, imei, serial_no, purchase_date, warranty_months)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(customerId, modelName, imei, serialNo, purchaseDate, warrantyMonths);
    return this.findById(Number(r.lastInsertRowid));
  }
}

module.exports = DeviceRepository;
