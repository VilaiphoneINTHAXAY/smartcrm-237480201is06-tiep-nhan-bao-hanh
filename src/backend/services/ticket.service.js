// ticket.service.js – Lớp 3: nghiệp vụ phiếu bảo hành. Nơi ghép ba quy tắc khi tạo phiếu:
// WarrantyRule (BR-02, BR-03) · ClassificationRule (BR-04) · SlaRule (BR-05).
// KHÔNG biết gì về HTTP: không có req, res, mã trạng thái. Lỗi ném bằng AppError với mã nghiệp vụ.
const AppError = require('../errors/AppError');
const { validateTaoPhieu } = require('../validators/ticket.validator');
const { kiemTraBaoHanh } = require('../rules/warranty.rule');
const { phanLoai } = require('../rules/classification.rule');
const { tinhHanSla } = require('../rules/sla.rule');
const { toTicketView } = require('./ticket.contract');

const TRANG_THAI = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT', 'DA_DONG'];
// Phiếu chỉ được đi tiến từng bước một, không nhảy cóc, không quay lui.
const BUOC_TIEP = { MOI: 'DA_PHAN_CONG', DA_PHAN_CONG: 'DANG_XU_LY', DANG_XU_LY: 'HOAN_TAT', HOAN_TAT: 'DA_DONG' };
const LECH_VN_MS = 7 * 60 * 60 * 1000;

// Ngày 'YYYY-MM-DD' theo giờ Việt Nam của một thời điểm (dùng cho WarrantyRule).
function ngayVN(thoiDiem) {
  return new Date(thoiDiem.getTime() + LECH_VN_MS).toISOString().slice(0, 10);
}

class TicketService {
  /**
   * @param {TicketRepository} ticketRepo
   * @param {DeviceRepository} deviceRepo
   * @param {() => Date} now  Đồng hồ – truyền vào để kiểm thử được với một thời điểm cố định.
   */
  constructor(ticketRepo, deviceRepo, now = () => new Date()) {
    this.repo = ticketRepo;
    this.deviceRepo = deviceRepo;
    this.now = now;
  }

  list({ status, unverified } = {}) {
    if (status && !TRANG_THAI.includes(status)) {
      throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Trạng thái lọc không hợp lệ', 'status');
    }
    const now = this.now();
    return this.repo.findAll({ status, unverified }).map((r) => toTicketView(r, now));
  }

  getById(id) {
    const row = this.repo.findById(id);
    if (!row) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy phiếu', 'id'); // GWT-19
    return toTicketView(row, this.now());
  }

  getLogs(id) {
    this.getById(id);
    return this.repo.findLogs(id);
  }

  // FR-03, FR-04, FR-07, FR-08: tạo phiếu, tự kiểm tra bảo hành, phân loại và sinh hạn SLA.
  create(input, nguoiDung) {
    const data = validateTaoPhieu(input);
    const id = this.repo.transaction(() => {
      const thietBi = data.deviceId ? this.#layThietBi(data.deviceId) : this.#taoThietBi(data.device);
      const luc = this.now();

      const bh = kiemTraBaoHanh(
        { ngayMua: thietBi.purchase_date, soThangBaoHanh: thietBi.warranty_months },
        ngayVN(luc)
      );
      const pl = phanLoai(data.issueDescription, this.repo.findCategories());
      const han = tinhHanSla(luc, pl.mucUuTien);

      const ticketId = this.repo.create({
        deviceId: thietBi.id,
        categoryId: pl.categoryId,
        createdBy: nguoiDung.id,
        issueDescription: data.issueDescription,
        priority: pl.mucUuTien,
        warrantyStatus: bh.warrantyStatus,
        isUnverified: bh.isUnverified,
        receivedAt: luc.toISOString(),
        slaDueAt: han.toISOString(),
      });
      // NFR-05: mọi lần tạo phiếu đều có dòng lịch sử kèm người và thời điểm
      this.repo.addLog({ ticketId, action: 'TAO_PHIEU', toStatus: 'MOI', changedBy: nguoiDung.id, changedAt: luc.toISOString() });
      return ticketId;
    });
    return this.getById(id);
  }

  // Sửa mô tả lỗi khi phiếu chưa xong -> phân loại lại. Hạn SLA KHÔNG tính lại (BR-05: chốt lúc tạo).
  update(id, input) {
    const phieu = this.getById(id);
    this.#phaiConMo(phieu);
    const moTa = typeof input?.issueDescription === 'string' ? input.issueDescription.trim() : '';
    if (!moTa) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Vui lòng nhập mô tả lỗi', 'issueDescription');
    const pl = phanLoai(moTa, this.repo.findCategories());
    this.repo.updateDescription(id, moTa, pl.categoryId, pl.mucUuTien);
    return this.getById(id);
  }

  changeStatus(id, input, nguoiDung) {
    const phieu = this.getById(id);
    const moi = input?.status;
    if (BUOC_TIEP[phieu.status] !== moi) {
      throw new AppError('TRANG_THAI_KHONG_HOP_LE',
        `Phiếu đang ở ${phieu.status}, chỉ chuyển được sang ${BUOC_TIEP[phieu.status] || '(không còn bước nào)'}`, 'status');
    }
    this.repo.transaction(() => {
      this.repo.updateStatus(id, moi);
      this.repo.addLog({ ticketId: id, action: 'DOI_TRANG_THAI', fromStatus: phieu.status, toStatus: moi,
        note: input.note, changedBy: nguoiDung.id, changedAt: this.now().toISOString() });
    });
    return this.getById(id);
  }

  // GWT-20 / BR-03: chỉ Quản lý TTBH được duyệt phiếu có cờ -> CÒN BẢO HÀNH, bỏ cờ.
  approveWarranty(id, nguoiDung) {
    const phieu = this.#phieuChoDuyet(id, nguoiDung);
    this.repo.transaction(() => {
      this.repo.updateWarranty(id, 'CON_BAO_HANH', false);
      this.repo.addLog({ ticketId: id, action: 'DUYET_BAO_HANH', fromStatus: phieu.status, toStatus: phieu.status,
        note: 'Duyệt: CÒN BẢO HÀNH', changedBy: nguoiDung.id, changedAt: this.now().toISOString() });
    });
    return this.getById(id);
  }

  // GWT-10 / BR-06: từ chối bắt buộc có lý do; giữ cờ, lý do vào lịch sử.
  rejectWarranty(id, input, nguoiDung) {
    const phieu = this.#phieuChoDuyet(id, nguoiDung);
    const lyDo = typeof input?.note === 'string' ? input.note.trim() : '';
    if (!lyDo) throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Phải nhập lý do khi từ chối', 'note');
    this.repo.addLog({ ticketId: id, action: 'TU_CHOI_BAO_HANH', fromStatus: phieu.status, toStatus: phieu.status,
      note: lyDo, changedBy: nguoiDung.id, changedAt: this.now().toISOString() });
    return this.getById(id);
  }

  // Chỉ xoá được phiếu vừa tạo nhầm (còn MOI); phiếu đã xử lý phải giữ để truy vết.
  remove(id) {
    const phieu = this.getById(id);
    if (phieu.status !== 'MOI') {
      throw new AppError('TRANG_THAI_KHONG_HOP_LE', 'Chỉ xoá được phiếu ở trạng thái MOI', 'status');
    }
    this.repo.remove(id);
  }

  #layThietBi(deviceId) {
    const tb = this.deviceRepo.findById(deviceId);
    if (!tb) throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy thiết bị', 'deviceId');
    return tb;
  }

  // BR-01: IMEI/Serial không trùng giữa hai thiết bị.
  #taoThietBi(device) {
    if (!this.deviceRepo.customerExists(device.customerId)) {
      throw new AppError('KHONG_TIM_THAY', 'Không tìm thấy khách hàng của thiết bị', 'customerId');
    }
    const trung = this.deviceRepo.findByImeiOrSerial(device.imei, device.serialNo);
    if (trung) {
      const field = device.imei && trung.imei === device.imei ? 'imei' : 'serialNo';
      throw new AppError('TRUNG_DU_LIEU', 'IMEI/Serial đã thuộc một thiết bị khác', field);
    }
    return this.deviceRepo.create(device);
  }

  #phaiConMo(phieu) {
    if (['HOAN_TAT', 'DA_DONG'].includes(phieu.status)) {
      throw new AppError('TRANG_THAI_KHONG_HOP_LE', 'Phiếu đã hoàn tất, không sửa được', 'status');
    }
  }

  #phieuChoDuyet(id, nguoiDung) {
    if (nguoiDung.role !== 'QUAN_LY') {
      throw new AppError('KHONG_DU_QUYEN', 'Chỉ Quản lý TTBH được duyệt hoặc từ chối bảo hành');
    }
    const phieu = this.getById(id);
    if (!phieu.isUnverified) {
      throw new AppError('TRANG_THAI_KHONG_HOP_LE', 'Phiếu này không chờ duyệt bảo hành', 'id');
    }
    return phieu;
  }
}

module.exports = TicketService;
