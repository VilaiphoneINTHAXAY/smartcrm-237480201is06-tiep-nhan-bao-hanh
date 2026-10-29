// ticket.contract.js – HỢP ĐỒNG dữ liệu MỘT PHIẾU mà lớp nghiệp vụ trả ra cho lớp API/giao diện (buổi 9).
// Giao diện chỉ biết hợp đồng này, KHÔNG biết tên cột trong CSDL: đổi tên cột chỉ phải sửa ở đây.
//
//  id               : số nguyên, luôn có
//  code             : chuỗi dạng BH-0001 (theo wireframe M1), luôn có
//  status           : 'MOI' | 'DA_PHAN_CONG' | 'DANG_XU_LY' | 'CHO_LINH_KIEN' | 'HOAN_TAT' | 'DA_DONG' | 'DA_HUY'
//                     (vòng đời Hình 6.2 của case study, QT-06)
//  priority         : 'CAO' | 'TRUNG_BINH' | 'THAP'
//  categoryName     : tên nhóm sự cố, luôn có ("Khác" nếu không khớp từ khoá)
//  warrantyStatus   : 'CON_BAO_HANH' | 'HET_BAO_HANH' | 'CHUA_XAC_MINH'
//  isUnverified     : boolean – true = đang chờ Quản lý duyệt bảo hành (BR-03)
//  issueDescription : chuỗi, luôn có
//  receivedAt       : chuỗi ISO 8601 (UTC, có chữ Z), luôn có
//  slaDueAt         : chuỗi ISO 8601 (UTC, có chữ Z), luôn có
//  allowedNextStatuses : mảng trạng thái được phép chuyển tiếp (QT-06), [] khi đã kết thúc
//  isOverdue        : boolean – phiếu CHƯA hoàn tất và đã quá hạn SLA (GWT-16, tô đỏ)
//  needsAttention   : boolean – phiếu chưa hoàn tất, còn ≤ 8 giờ hoặc đã quá hạn (GWT-16)
//  createdByName    : họ tên người tiếp nhận (M3), luôn có
//  customer         : { id, fullName, phone } – phone đã che (090****567) nếu người xem không phải Quản lý (QT-15)
//  device           : { id, modelName, imei: chuỗi|null, serialNo: chuỗi|null,
//                       purchaseDate: 'YYYY-MM-DD'|null (null = chưa có ngày mua), warrantyMonths }
const { cheSoDienThoai, duocXemSoDayDu } = require('../rules/phone.rule');

const TAM_GIO_MS = 8 * 60 * 60 * 1000;
// Phiếu đã kết thúc: không còn tính SLA, không sửa được nữa.
const DA_KET_THUC = ['HOAN_TAT', 'DA_DONG', 'DA_HUY'];

// QT-06 – vòng đời phiếu theo Hình 6.2 của case study: chỉ đi tiến, không quay lại.
// DA_HUY: khách huỷ khi phiếu còn MOI hoặc DA_PHAN_CONG.
const CHUYEN_TIEP = {
  MOI: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT'],
  CHO_LINH_KIEN: ['HOAN_TAT'],
  HOAN_TAT: ['DA_DONG'],
  DA_DONG: [],
  DA_HUY: [],
};

/**
 * @param {object} row       Một dòng phiếu do TicketRepository trả về (đã kèm khách, thiết bị, nhóm sự cố).
 * @param {Date}   now       Thời điểm hiện tại (tính quá hạn).
 * @param {object} nguoiXem  Người đang xem { role } – quyết định có che SĐT hay không (QT-15).
 */
function toTicketView(row, now = new Date(), nguoiXem) {
  const conMo = !DA_KET_THUC.includes(row.status);
  const conLaiMs = new Date(row.sla_due_at).getTime() - now.getTime();
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    allowedNextStatuses: CHUYEN_TIEP[row.status] || [],
    priority: row.priority,
    categoryName: row.category_name,
    warrantyStatus: row.warranty_status,
    isUnverified: row.is_unverified === 1,
    issueDescription: row.issue_description,
    receivedAt: row.received_at,
    createdByName: row.created_by_name,
    slaDueAt: row.sla_due_at,
    isOverdue: conMo && conLaiMs < 0,
    needsAttention: conMo && conLaiMs <= TAM_GIO_MS,
    customer: {
      id: row.customer_id,
      fullName: row.customer_name,
      phone: duocXemSoDayDu(nguoiXem) ? row.customer_phone : cheSoDienThoai(row.customer_phone),
    },
    device: {
      id: row.device_id,
      modelName: row.model_name,
      imei: row.imei,
      serialNo: row.serial_no,
      purchaseDate: row.purchase_date,
      warrantyMonths: row.warranty_months,
    },
  };
}

module.exports = { toTicketView, CHUYEN_TIEP, DA_KET_THUC };
