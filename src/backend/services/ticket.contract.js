// ticket.contract.js – HỢP ĐỒNG dữ liệu MỘT PHIẾU mà lớp nghiệp vụ trả ra cho lớp API/giao diện (buổi 9).
// Giao diện chỉ biết hợp đồng này, KHÔNG biết tên cột trong CSDL: đổi tên cột chỉ phải sửa ở đây.
//
//  id               : số nguyên, luôn có
//  code             : chuỗi dạng BH-000001, luôn có
//  status           : 'MOI' | 'DA_PHAN_CONG' | 'DANG_XU_LY' | 'HOAN_TAT' | 'DA_DONG'
//  priority         : 'CAO' | 'TRUNG_BINH' | 'THAP'
//  categoryName     : tên nhóm sự cố, luôn có ("Khác" nếu không khớp từ khoá)
//  warrantyStatus   : 'CON_BAO_HANH' | 'HET_BAO_HANH' | 'CHUA_XAC_MINH'
//  isUnverified     : boolean – true = đang chờ Quản lý duyệt bảo hành (BR-03)
//  issueDescription : chuỗi, luôn có
//  receivedAt       : chuỗi ISO 8601 (UTC, có chữ Z), luôn có
//  slaDueAt         : chuỗi ISO 8601 (UTC, có chữ Z), luôn có
//  isOverdue        : boolean – phiếu CHƯA hoàn tất và đã quá hạn SLA (GWT-16, tô đỏ)
//  needsAttention   : boolean – phiếu chưa hoàn tất, còn ≤ 8 giờ hoặc đã quá hạn (GWT-16)
//  customer         : { id, fullName, phone }
//  device           : { id, modelName, imei: chuỗi|null, serialNo: chuỗi|null,
//                       purchaseDate: 'YYYY-MM-DD'|null (null = chưa có ngày mua), warrantyMonths }
const TAM_GIO_MS = 8 * 60 * 60 * 1000;
const DA_XONG = ['HOAN_TAT', 'DA_DONG'];

function toTicketView(row, now = new Date()) {
  const conMo = !DA_XONG.includes(row.status);
  const conLaiMs = new Date(row.sla_due_at).getTime() - now.getTime();
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    priority: row.priority,
    categoryName: row.category_name,
    warrantyStatus: row.warranty_status,
    isUnverified: row.is_unverified === 1,
    issueDescription: row.issue_description,
    receivedAt: row.received_at,
    slaDueAt: row.sla_due_at,
    isOverdue: conMo && conLaiMs < 0,
    needsAttention: conMo && conLaiMs <= TAM_GIO_MS,
    customer: { id: row.customer_id, fullName: row.customer_name, phone: row.customer_phone },
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

module.exports = { toTicketView };
