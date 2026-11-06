// password.js – Băm và so mật khẩu (OWASP A04, checklist bảo mật mục 4). Dùng chung cho AuthService và migrate.
// Định dạng lưu: 'scrypt$<salt hex 16 byte NGẪU NHIÊN cho từng tài khoản>$<hash hex 32 byte>'.
const crypto = require('node:crypto');

function hashMatKhau(matKhau) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(matKhau), salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

// timingSafeEqual để thời gian so không lộ thông tin.
function dungMatKhau(matKhau, chuoiHash) {
  const [thuatToan, salt, hash] = String(chuoiHash).split('$');
  if (thuatToan !== 'scrypt' || !salt || !hash) return false;
  const tinh = crypto.scryptSync(String(matKhau), salt, 32);
  const luu = Buffer.from(hash, 'hex');
  return luu.length === tinh.length && crypto.timingSafeEqual(luu, tinh);
}

module.exports = { hashMatKhau, dungMatKhau };
