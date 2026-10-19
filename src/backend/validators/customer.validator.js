// customer.validator.js – Kiểm tra ĐỊNH DẠNG dữ liệu khách hàng (chưa đụng tới CSDL).
const AppError = require('../errors/AppError');

const PHONE_REGEX = /^0\d{9,10}$/;   // SĐT Việt Nam: bắt đầu bằng 0, tổng 10–11 chữ số

function validateCustomer(input, { partial = false } = {}) {
  const data = input || {};
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : data.fullName;
  const phone = typeof data.phone === 'string' ? data.phone.trim() : data.phone;

  if (!partial || fullName !== undefined) {
    if (!fullName) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Thiếu họ tên khách hàng', 'fullName');
    if (fullName.length > 100) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Họ tên tối đa 100 ký tự', 'fullName');
  }
  if (!partial || phone !== undefined) {
    if (!phone) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Thiếu số điện thoại', 'phone');
    if (!PHONE_REGEX.test(phone)) {
      throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số', 'phone');
    }
  }
  return { fullName, phone };
}

module.exports = { validateCustomer };
