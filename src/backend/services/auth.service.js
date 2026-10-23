// auth.service.js – Lớp 3: đăng nhập và phiên làm việc (NFR-06).
// Phiên lưu trong bộ nhớ của tiến trình: khởi động lại server thì phải đăng nhập lại.
// Chấp nhận ở mức prototype BT2 (ghi trong README); BT3 có thể chuyển sang lưu CSDL.
const crypto = require('node:crypto');
const AppError = require('../errors/AppError');

// So mật khẩu với chuỗi 'scrypt$<salt>$<hash>'. timingSafeEqual để thời gian so không lộ thông tin.
function dungMatKhau(matKhau, chuoiHash) {
  const [thuatToan, salt, hash] = String(chuoiHash).split('$');
  if (thuatToan !== 'scrypt' || !salt || !hash) return false;
  const tinh = crypto.scryptSync(String(matKhau), salt, 32);
  const luu = Buffer.from(hash, 'hex');
  return luu.length === tinh.length && crypto.timingSafeEqual(luu, tinh);
}

class AuthService {
  /**
   * @param {UserRepository} userRepo
   * @param {{timeoutMinutes?: number, now?: () => number}} options
   */
  constructor(userRepo, { timeoutMinutes = 30, now = () => Date.now() } = {}) {
    this.userRepo = userRepo;
    this.timeoutMs = timeoutMinutes * 60 * 1000;
    this.now = now;
    this.phien = new Map(); // token -> { user, lanCuoi }
  }

  login(username, password) {
    const u = this.userRepo.findByUsername(String(username || '').trim());
    // Cùng một thông báo cho "sai tên" và "sai mật khẩu" để không lộ tên đăng nhập nào tồn tại.
    if (!u || u.is_active !== 1 || !dungMatKhau(password, u.password_hash)) {
      throw new AppError('SAI_DANG_NHAP', 'Sai tên đăng nhập hoặc mật khẩu');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const user = { id: u.id, username: u.username, fullName: u.full_name, role: u.role };
    this.phien.set(token, { user, lanCuoi: this.now() });
    return { token, user };
  }

  // Trả người dùng của token; hết 30 phút không hoạt động -> CHUA_DANG_NHAP (401).
  verify(token) {
    const p = token ? this.phien.get(token) : undefined;
    if (!p) throw new AppError('CHUA_DANG_NHAP', 'Vui lòng đăng nhập');
    if (this.now() - p.lanCuoi > this.timeoutMs) {
      this.phien.delete(token);
      throw new AppError('CHUA_DANG_NHAP', 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
    }
    p.lanCuoi = this.now(); // còn hoạt động -> gia hạn phiên
    return p.user;
  }

  logout(token) {
    this.phien.delete(token);
  }
}

module.exports = AuthService;
