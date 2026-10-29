// customer.validator.js – Kiểm tra ĐỊNH DẠNG dữ liệu khách hàng (chưa đụng tới CSDL).
const AppError = require('../errors/AppError');
const { chuanHoaSoDienThoai } = require('../rules/phone.rule');

function validateCustomer(input, { partial = false } = {}) {
  const data = input || {};
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : data.fullName;
  const phoneNhap = typeof data.phone === 'string' ? data.phone.trim() : data.phone;
  let phone;

  if (!partial || fullName !== undefined) {
    if (!fullName) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Thiếu họ tên khách hàng', 'fullName');
    if (fullName.length > 100) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Họ tên tối đa 100 ký tự', 'fullName');
  }
  if (!partial || phoneNhap !== undefined) {
    if (!phoneNhap) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Thiếu số điện thoại', 'phone');
    phone = chuanHoaSoDienThoai(phoneNhap);   // QT-02: chuẩn hoá trước khi lưu
    if (!phone) {
      throw new AppError('DU_LIEU_KHONG_HOP_LE',
        'Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (chấp nhận +84…, 84…, có dấu cách hoặc dấu chấm)', 'phone');
    }
  }
  return { fullName, phone };
}

module.exports = { validateCustomer };
