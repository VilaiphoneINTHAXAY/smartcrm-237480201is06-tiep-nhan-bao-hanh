// Quy tắc về số điện thoại khách hàng của case study (hàm thuần, test được độc lập):
//   QT-02: chuẩn hoá về dạng 10 chữ số bắt đầu bằng 0 TRƯỚC KHI LƯU và trước khi tra cứu.
//   QT-15: hiển thị dạng che (090****567) với mọi vai trò trừ Quản lý.
// Xem TD-07 trong docs/thay-doi-thiet-ke.md.

/**
 * QT-02: đưa mọi dạng nhập về dạng chuẩn 0xxxxxxxxx.
 * Chấp nhận: '0901234567', '+84901234567', '84901234567', '090 123 4567', '090.123.4567', '090-123-4567'.
 * @param {string} raw  Số điện thoại người dùng nhập.
 * @returns {string|null} Số chuẩn 10 chữ số, hoặc null nếu không quy về được (để validator báo lỗi).
 */
function chuanHoaSoDienThoai(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[\s.\-()]/g, '');   // bỏ dấu cách, dấu chấm, gạch nối, ngoặc
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length === 11) s = '0' + s.slice(2);
  return /^0\d{9}$/.test(s) ? s : null;
}

/**
 * QT-15: che số điện thoại, giữ 3 số đầu và 3 số cuối: '0901234567' -> '090****567'.
 * @param {string} phone  Số đã chuẩn hoá.
 * @returns {string}
 */
function cheSoDienThoai(phone) {
  if (typeof phone !== 'string' || phone.length < 7) return phone;
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
}

/** QT-15: chỉ Quản lý (và Ban giám đốc – ngoài phạm vi L2) được xem số đầy đủ. */
function duocXemSoDayDu(nguoiXem) {
  return nguoiXem?.role === 'QUAN_LY';
}

module.exports = { chuanHoaSoDienThoai, cheSoDienThoai, duocXemSoDayDu };
