// customer.service.js – Lớp 3: quy tắc nghiệp vụ của khách hàng.
// KHÔNG biết gì về HTTP: không có req, res, mã trạng thái. Lỗi được ném bằng AppError với mã nghiệp vụ.
const AppError = require('../errors/AppError');
const { validateCustomer } = require('../validators/customer.validator');

class CustomerService {
  constructor(customerRepo) {
    this.repo = customerRepo;
  }

  list() {
    return this.repo.findAll();
  }

  // FR-01: tra cứu khách theo SĐT, trả kèm danh sách thiết bị đã đăng ký
  findByPhone(phone) {
    const customer = this.repo.findByPhone(String(phone || '').trim());
    if (!customer) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy khách hàng với SĐT này', 'phone');
    return { ...customer, devices: this.repo.findDevices(customer.id) };
  }

  getById(id) {
    const customer = this.repo.findById(id);
    if (!customer) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy khách hàng', 'id');
    return customer;
  }

  // FR-02 + BR-07: một SĐT chỉ thuộc một khách hàng
  create(input) {
    const data = validateCustomer(input);
    if (this.repo.findByPhone(data.phone)) {
      throw new AppError('TRUNG_DU_LIEU', 'Số điện thoại đã thuộc về một khách hàng khác', 'phone');
    }
    return this.repo.create(data);
  }

  update(id, input) {
    this.getById(id);
    const data = validateCustomer(input, { partial: true });
    if (data.phone) {
      const other = this.repo.findByPhone(data.phone);
      if (other && other.id !== id) {
        throw new AppError('TRUNG_DU_LIEU', 'Số điện thoại đã thuộc về một khách hàng khác', 'phone');
      }
    }
    return this.repo.update(id, data);
  }

  // Không cho xoá khách đã có thiết bị (thiết bị và phiếu bảo hành phụ thuộc vào khách)
  remove(id) {
    this.getById(id);
    if (this.repo.countDevices(id) > 0) {
      throw new AppError('DANG_DUOC_SU_DUNG', 'Không thể xoá khách hàng đã có thiết bị', 'id');
    }
    this.repo.remove(id);
  }
}

module.exports = CustomerService;
