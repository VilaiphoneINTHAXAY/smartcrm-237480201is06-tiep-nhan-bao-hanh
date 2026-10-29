// Kiểm thử quy tắc BR-05 (hạn SLA). Không cần CSDL: SlaRule là hàm thuần.
// Ngày làm việc thứ Hai – thứ Bảy theo QT-04 của case study (TD-06).
const test = require('node:test');
const assert = require('node:assert/strict');
const { tinhHanSla } = require('../src/backend/rules/sla.rule');

// Viết thời điểm kèm +07:00 để test cho kết quả giống nhau trên mọi máy.
const vn = (s) => new Date(`${s}+07:00`);

test('GWT-14 luồng đúng: THAP, thứ Hai 05/10 10:00 -> thứ Bảy 10/10 10:00 (thứ Bảy là ngày làm việc)', () => {
  const han = tinhHanSla(vn('2026-10-05T10:00:00'), 'THAP');
  assert.equal(han.getTime(), vn('2026-10-10T10:00:00').getTime());
});

test('GWT-13 giá trị biên: CAO, thứ Sáu 02/10 09:00 -> thứ Bảy 03/10 09:00 (không bỏ qua thứ Bảy)', () => {
  const han = tinhHanSla(vn('2026-10-02T09:00:00'), 'CAO');
  assert.equal(han.getTime(), vn('2026-10-03T09:00:00').getTime());
});

test('Giá trị biên: CAO, thứ Bảy 03/10 09:00 -> bỏ qua Chủ nhật, thứ Hai 05/10 09:00', () => {
  const han = tinhHanSla(vn('2026-10-03T09:00:00'), 'CAO');
  assert.equal(han.getTime(), vn('2026-10-05T09:00:00').getTime());
});

test('GWT-15 ngoại lệ: tiếp nhận Chủ nhật -> tính từ 08:00 thứ Hai, CAO thành thứ Ba 08:00', () => {
  const han = tinhHanSla(vn('2026-10-04T15:30:00'), 'CAO');
  assert.equal(han.getTime(), vn('2026-10-06T08:00:00').getTime());
});

test('Giá trị biên: Chủ nhật 23:59 vẫn là ngày nghỉ -> TRUNG_BINH thành thứ Năm 08:00', () => {
  const han = tinhHanSla(vn('2026-10-04T23:59:00'), 'TRUNG_BINH');
  assert.equal(han.getTime(), vn('2026-10-08T08:00:00').getTime());
});

test('Dữ liệu sai: mức ưu tiên lạ thì báo lỗi rõ ràng, không trả về hạn sai', () => {
  assert.throws(() => tinhHanSla(vn('2026-10-05T10:00:00'), 'KHAN_CAP'), RangeError);
});
