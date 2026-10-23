// Định dạng hiển thị theo wireframe BT1 (giờ Việt Nam) – không đổi dữ liệu.
const TZ = 'Asia/Ho_Chi_Minh';
const phan = (iso, opts) => new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, hour12: false, ...opts })
  .formatToParts(new Date(iso)).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});

// "02/10/2026 09:00" (M1, M3)
export function thoiGian(iso) {
  if (!iso) return '—';
  const p = phan(iso, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}
// "09/10 15:30" (bảng M2)
export function thoiGianNgan(iso) {
  const p = phan(iso, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
}
// 'YYYY-MM-DD' -> 'DD/MM/YYYY'
export const ngay = (s) => (s ? s.split('-').reverse().join('/') : '(trống)');

export const TEN_TRANG_THAI = {
  MOI: 'MỚI', DA_PHAN_CONG: 'ĐÃ PHÂN CÔNG', DANG_XU_LY: 'ĐANG XỬ LÝ', HOAN_TAT: 'HOÀN TẤT', DA_DONG: 'ĐÃ ĐÓNG',
};
export const TEN_BAO_HANH = {
  CON_BAO_HANH: 'CÒN BẢO HÀNH', HET_BAO_HANH: 'HẾT BẢO HÀNH', CHUA_XAC_MINH: 'CHƯA XÁC MINH',
};
export const TEN_HANH_DONG = {
  TAO_PHIEU: 'Tạo phiếu', DOI_TRANG_THAI: 'Đổi trạng thái', DUYET_BAO_HANH: 'Duyệt bảo hành', TU_CHOI_BAO_HANH: 'Từ chối bảo hành',
};
export const TEN_VAI_TRO = { TIEP_NHAN: 'Nhân viên tiếp nhận', QUAN_LY: 'Quản lý TTBH' };

// "còn 5,5 giờ" / "quá hạn 3 giờ" – con số có ngữ cảnh so với hạn SLA (buổi 9)
export function conLai(iso, now = Date.now()) {
  const gio = (new Date(iso).getTime() - now) / 3_600_000;
  const so = Math.abs(gio).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  return gio >= 0 ? `còn ${so} giờ` : `quá hạn ${so} giờ`;
}
