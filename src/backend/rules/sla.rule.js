// Quy tắc BR-05: tính hạn SLA theo mức ưu tiên (GWT-13, GWT-14, GWT-15).
// Hàm thuần: không đọc CSDL, không biết HTTP -> test được độc lập.

// CAO 24h, TRUNG_BINH 72h, THAP 120h, quy đổi thành 1/3/5 ngày làm việc (BR-05).
const SO_NGAY_LAM_VIEC = { CAO: 1, TRUNG_BINH: 3, THAP: 5 };

// Mekong Mobile làm việc theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
// Ta dời mốc thời gian +7 giờ rồi dùng các hàm getUTC*/setUTC* để đọc "giờ Việt Nam"
// mà không phụ thuộc múi giờ của máy đang chạy (máy GV có thể khác máy em).
const LECH_VN_MS = 7 * 60 * 60 * 1000;

function laCuoiTuan(vn) {
  const thu = vn.getUTCDay(); // 0 = Chủ nhật, 6 = thứ Bảy
  return thu === 0 || thu === 6;
}

/**
 * Tính hạn SLA cho một phiếu (BR-05).
 *
 * @param {Date} thoiDiemTiepNhan  Thời điểm tiếp nhận (một mốc thời gian thật).
 * @param {'CAO'|'TRUNG_BINH'|'THAP'} mucUuTien  Mức ưu tiên do ClassificationRule gán.
 * @returns {Date} Hạn SLA: cộng 1/3/5 ngày làm việc, giữ nguyên giờ tiếp nhận.
 *   Tiếp nhận thứ Bảy/Chủ nhật -> tính từ 08:00 thứ Hai kế tiếp (GWT-15).
 * @throws {RangeError} Khi thời điểm không hợp lệ hoặc mức ưu tiên lạ —
 *   đây là lỗi dữ liệu của lập trình viên, không phải lỗi người dùng.
 */
function tinhHanSla(thoiDiemTiepNhan, mucUuTien) {
  if (!(thoiDiemTiepNhan instanceof Date) || Number.isNaN(thoiDiemTiepNhan.getTime())) {
    throw new RangeError('Thời điểm tiếp nhận không hợp lệ');
  }
  const soNgay = SO_NGAY_LAM_VIEC[mucUuTien];
  if (soNgay === undefined) {
    throw new RangeError(`Mức ưu tiên không hợp lệ: ${mucUuTien}`);
  }

  // Làm việc trên "đồng hồ Việt Nam".
  const vn = new Date(thoiDiemTiepNhan.getTime() + LECH_VN_MS);

  // GWT-15: tiếp nhận cuối tuần -> dời tới 08:00 thứ Hai kế tiếp.
  if (laCuoiTuan(vn)) {
    do {
      vn.setUTCDate(vn.getUTCDate() + 1);
    } while (laCuoiTuan(vn));
    vn.setUTCHours(8, 0, 0, 0);
  }

  // Cộng từng ngày, chỉ đếm ngày làm việc (bỏ qua thứ Bảy, Chủ nhật).
  // Chưa xử lý ngày lễ — giả định đã ghi trong SRS mục 1.5.
  let conLai = soNgay;
  while (conLai > 0) {
    vn.setUTCDate(vn.getUTCDate() + 1);
    if (!laCuoiTuan(vn)) conLai -= 1;
  }

  return new Date(vn.getTime() - LECH_VN_MS);
}

module.exports = { tinhHanSla, SO_NGAY_LAM_VIEC };
