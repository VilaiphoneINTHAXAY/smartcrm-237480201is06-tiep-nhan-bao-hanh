// Quy tắc BR-02, BR-03: kiểm tra thiết bị còn bảo hành hay không (GWT-06 … GWT-09).
// Hàm thuần: nhận ngày dạng chuỗi 'YYYY-MM-DD', không đọc CSDL, không biết HTTP.
const AppError = require('../errors/AppError');

const DINH_DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/;

// Đổi 'YYYY-MM-DD' thành Date lúc 00:00 UTC; trả null nếu ngày không tồn tại (vd 2026-02-30).
function docNgay(chuoi) {
  if (typeof chuoi !== 'string' || !DINH_DANG_NGAY.test(chuoi)) return null;
  const d = new Date(`${chuoi}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== chuoi) return null;
  return d;
}

/**
 * Ngày hết bảo hành = ngày mua + số tháng theo tháng lịch (BR-02).
 * Ngày không tồn tại ở tháng đích -> lấy ngày cuối tháng (31/01 + 1 tháng = 28/02).
 * @param {string} ngayMua 'YYYY-MM-DD'
 * @param {number} soThang số tháng bảo hành (0–60)
 * @returns {string} 'YYYY-MM-DD'
 */
function tinhNgayHetHan(ngayMua, soThang) {
  const d = docNgay(ngayMua);
  const ngay = d.getUTCDate();
  // Đặt về ngày 1 trước khi cộng tháng để JavaScript không "tràn" sang tháng sau.
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + soThang);
  // Ngày cuối của tháng đích: ngày 0 của tháng kế tiếp.
  const cuoiThang = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(ngay, cuoiThang));
  return d.toISOString().slice(0, 10);
}

/**
 * Kiểm tra tình trạng bảo hành khi tiếp nhận (BR-02, BR-03).
 *
 * @param {{ngayMua: string|null, soThangBaoHanh: number}} thietBi
 * @param {string} ngayTiepNhan 'YYYY-MM-DD' theo giờ Việt Nam
 * @returns {{warrantyStatus: 'CON_BAO_HANH'|'HET_BAO_HANH'|'CHUA_XAC_MINH',
 *            isUnverified: boolean, ngayHetHan: string|null}}
 *   Thiếu ngày mua -> CHUA_XAC_MINH và gắn cờ chờ Quản lý duyệt (GWT-09).
 * @throws {AppError} DU_LIEU_KHONG_HOP_LE khi ngày sai định dạng
 *   hoặc ngày mua sau ngày tiếp nhận (GWT-08) — lỗi người dùng nhập.
 */
function kiemTraBaoHanh(thietBi, ngayTiepNhan) {
  if (!docNgay(ngayTiepNhan)) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Ngày tiếp nhận không hợp lệ', 'receivedAt');
  }

  // GWT-09: thiếu ngày mua -> chưa xác minh, gắn cờ.
  if (thietBi.ngayMua === null || thietBi.ngayMua === undefined || thietBi.ngayMua === '') {
    return { warrantyStatus: 'CHUA_XAC_MINH', isUnverified: true, ngayHetHan: null };
  }
  if (!docNgay(thietBi.ngayMua)) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Ngày mua không hợp lệ (định dạng YYYY-MM-DD)', 'purchaseDate');
  }
  // GWT-08: so sánh được bằng chuỗi vì cùng định dạng YYYY-MM-DD.
  if (thietBi.ngayMua > ngayTiepNhan) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Ngày mua không được sau ngày tiếp nhận', 'purchaseDate');
  }

  const ngayHetHan = tinhNgayHetHan(thietBi.ngayMua, thietBi.soThangBaoHanh);
  // GWT-06: đúng ngày hết hạn vẫn tính là CÒN bảo hành (dùng <=, không dùng <).
  const con = ngayTiepNhan <= ngayHetHan;
  return {
    warrantyStatus: con ? 'CON_BAO_HANH' : 'HET_BAO_HANH',
    isUnverified: false,
    ngayHetHan,
  };
}

module.exports = { kiemTraBaoHanh, tinhNgayHetHan };
