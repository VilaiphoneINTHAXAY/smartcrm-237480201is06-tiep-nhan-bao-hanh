// customer.service.js – Lớp 3: quy tắc nghiệp vụ của khách hàng.
// KHÔNG biết gì về HTTP: không có req, res, mã trạng thái. Lỗi được ném bằng AppError với mã nghiệp vụ.
const AppError = require('../errors/AppError');
const { validateCustomer } = require('../validators/customer.validator');
const { chuanHoaSoDienThoai, cheSoDienThoai, duocXemSoDayDu } = require('../rules/phone.rule');

// QT-15: khách hàng trả ra cho người xem – che SĐT trừ khi người xem là Quản lý.
function hienThi(customer, nguoiXem) {
  if (!customer || duocXemSoDayDu(nguoiXem)) return customer;
  return { ...customer, phone: cheSoDienThoai(customer.phone) };
}

class CustomerService {
  constructor(customerRepo) {
    this.repo = customerRepo;
  }

  list(nguoiXem) {
    return this.repo.findAll().map((c) => hienThi(c, nguoiXem));
  }

  // FR-01: tra cứu khách theo SĐT, trả kèm danh sách thiết bị đã đăng ký.
  // QT-02: chuẩn hoá SĐT trước khi tra cứu -> nhập "+84 90 123 4567" vẫn tìm ra "0901234567".
  findByPhone(phone, nguoiXem) {
    const chuan = chuanHoaSoDienThoai(String(phone || ''));
    const customer = chuan && this.repo.findByPhone(chuan);
    if (!customer) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy khách hàng với SĐT này', 'phone');
    return { ...hienThi(customer, nguoiXem), devices: this.repo.findDevices(customer.id) };
  }

  getById(id, nguoiXem) {
    const customer = this.repo.findById(id);
    if (!customer) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy khách hàng', 'id');
    return hienThi(customer, nguoiXem);
  }

  // FR-02 + BR-07 + QT-01: một SĐT chỉ thuộc một khách hàng (SĐT đã chuẩn hoá theo QT-02)
  create(input, nguoiXem) {
    const data = validateCustomer(input);
    if (this.repo.phoneExists(data.phone)) {
      throw new AppError('TRUNG_DU_LIEU', 'Số điện thoại đã thuộc về một khách hàng khác', 'phone');
    }
    return hienThi(this.repo.create(data), nguoiXem);
  }

  update(id, input, nguoiXem) {
    this.getById(id);
    const data = validateCustomer(input, { partial: true });
    if (data.phone) {
      const other = this.repo.phoneExists(data.phone);
      if (other && other.id !== id) {
        throw new AppError('TRUNG_DU_LIEU', 'Số điện thoại đã thuộc về một khách hàng khác', 'phone');
      }
    }
    return hienThi(this.repo.update(id, data), nguoiXem);
  }

  // QT-13: "xoá" = đánh dấu ngừng sử dụng, không xoá vật lý.
  // Vẫn không cho ngừng khách đã có thiết bị (thiết bị và phiếu bảo hành đang gắn với khách).
  remove(id) {
    this.getById(id);
    if (this.repo.countDevices(id) > 0) {
      throw new AppError('DANG_DUOC_SU_DUNG', 'Không thể xoá khách hàng đã có thiết bị', 'id');
    }
    this.repo.deactivate(id);
  }
}

module.exports = CustomerService;
