// ticket.repository.js – Lớp 4: nơi DUY NHẤT viết SQL cho ticket và ticket_status_log.
// Không chứa quy tắc nghiệp vụ. Mọi câu SQL đều tham số hoá (?).

// Một phiếu kèm thông tin khách, thiết bị, nhóm sự cố để lớp trên không phải JOIN.
const SELECT_PHIEU = `
  SELECT t.id, t.code, t.device_id, t.category_id, t.created_by, t.issue_description,
         t.priority, t.status, t.warranty_status, t.is_unverified, t.received_at, t.sla_due_at,
         d.model_name, d.imei, d.serial_no, d.purchase_date, d.warranty_months,
         c.id AS customer_id, c.full_name AS customer_name, c.phone AS customer_phone,
         ic.name AS category_name, u.full_name AS created_by_name
  FROM ticket t
  JOIN device d          ON d.id = t.device_id
  JOIN customer c        ON c.id = d.customer_id
  JOIN issue_category ic ON ic.id = t.category_id
  JOIN app_user u        ON u.id = t.created_by`;

class TicketRepository {
  constructor(db) {
    this.db = db;
  }

  // Gom nhiều câu lệnh thành một giao dịch: lỗi giữa chừng thì không ghi gì (NFR-05).
  transaction(fn) {
    this.db.exec('BEGIN');
    try {
      const kq = fn();
      this.db.exec('COMMIT');
      return kq;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  findAll({ status, unverified } = {}) {
    const dieuKien = [];
    const thamSo = [];
    if (status) { dieuKien.push('t.status = ?'); thamSo.push(status); }
    if (unverified) dieuKien.push('t.is_unverified = 1');
    const where = dieuKien.length ? `WHERE ${dieuKien.join(' AND ')}` : '';
    // Sắp theo hạn SLA: phiếu cần xử lý trước nằm trên (US06)
    return this.db.prepare(`${SELECT_PHIEU} ${where} ORDER BY t.sla_due_at, t.id`).all(...thamSo);
  }

  findById(id) {
    return this.db.prepare(`${SELECT_PHIEU} WHERE t.id = ?`).get(id);
  }

  findCategories() {
    return this.db.prepare('SELECT id, name, keywords, default_priority, match_order FROM issue_category').all();
  }

  create(p) {
    // Mã phiếu sinh từ id tự tăng -> không trùng kể cả khi 20 người tạo cùng lúc (NFR-04).
    const r = this.db.prepare(
      `INSERT INTO ticket (code, device_id, category_id, created_by, issue_description, priority,
                           status, warranty_status, is_unverified, received_at, sla_due_at)
       VALUES ('TAM', ?, ?, ?, ?, ?, 'MOI', ?, ?, ?, ?)`
    ).run(p.deviceId, p.categoryId, p.createdBy, p.issueDescription, p.priority,
      p.warrantyStatus, p.isUnverified ? 1 : 0, p.receivedAt, p.slaDueAt);
    const id = Number(r.lastInsertRowid);
    this.db.prepare('UPDATE ticket SET code = ? WHERE id = ?').run(`BH-${String(id).padStart(4, '0')}`, id);
    return id;
  }

  updateDescription(id, issueDescription, categoryId, priority) {
    this.db.prepare('UPDATE ticket SET issue_description = ?, category_id = ?, priority = ? WHERE id = ?')
      .run(issueDescription, categoryId, priority, id);
  }

  updateStatus(id, status) {
    this.db.prepare('UPDATE ticket SET status = ? WHERE id = ?').run(status, id);
  }

  updateWarranty(id, warrantyStatus, isUnverified) {
    this.db.prepare('UPDATE ticket SET warranty_status = ?, is_unverified = ? WHERE id = ?')
      .run(warrantyStatus, isUnverified ? 1 : 0, id);
  }

  // Các phiếu của một thiết bị (mới nhất trước). Phiếu nào "đang mở" do lớp service quyết định.
  findByDevice(deviceId) {
    return this.db.prepare('SELECT id, code, status FROM ticket WHERE device_id = ? ORDER BY id DESC').all(deviceId);
  }

  addLog({ ticketId, action, fromStatus, toStatus, note, changedBy, changedAt }) {
    this.db.prepare(
      `INSERT INTO ticket_status_log (ticket_id, action, from_status, to_status, note, changed_by, changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(ticketId, action, fromStatus ?? null, toStatus, note ?? null, changedBy, changedAt);
  }

  // GWT-18: lịch sử theo thời gian tăng dần
  findLogs(ticketId) {
    return this.db.prepare(
      `SELECT l.id, l.action, l.from_status, l.to_status, l.note, l.changed_at, u.full_name AS changed_by_name
       FROM ticket_status_log l JOIN app_user u ON u.id = l.changed_by
       WHERE l.ticket_id = ? ORDER BY l.changed_at, l.id`
    ).all(ticketId);
  }
}

module.exports = TicketRepository;
