// user.repository.js – Lớp 4: SQL cho bảng app_user.
class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findByUsername(username) {
    return this.db.prepare(
      'SELECT id, username, full_name, role, password_hash, is_active FROM app_user WHERE username = ?'
    ).get(username);
  }
}

module.exports = UserRepository;
