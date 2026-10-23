// Định dạng hiển thị cho người đọc (giờ Việt Nam, nhãn tiếng Việt) – không đổi dữ liệu.
const FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
export const thoiGian = (iso) => (iso ? FMT.format(new Date(iso)) : '—');

export const TEN_TRANG_THAI = {
  MOI: 'Mới', DA_PHAN_CONG: 'Đã phân công', DANG_XU_LY: 'Đang xử lý', HOAN_TAT: 'Hoàn tất', DA_DONG: 'Đã đóng',
};
export const TEN_BAO_HANH = {
  CON_BAO_HANH: 'Còn bảo hành', HET_BAO_HANH: 'Hết bảo hành', CHUA_XAC_MINH: 'Chưa xác minh',
};
export const TEN_UU_TIEN = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };

// "còn 5,5 giờ" / "quá hạn 3 giờ" – con số có ngữ cảnh so với hạn SLA (buổi 9, nguyên tắc 2)
export function conLai(iso, now = Date.now()) {
  const gio = (new Date(iso).getTime() - now) / 3_600_000;
  const so = Math.abs(gio).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  return gio >= 0 ? `còn ${so} giờ` : `quá hạn ${so} giờ`;
}
