// Kiểm thử quy tắc BR-05 (hạn SLA). Không cần CSDL: SlaRule là hàm thuần.
const test = require('node:test');
const assert = require('node:assert/strict');
const { tinhHanSla } = require('../src/backend/rules/sla.rule');

// Viết thời điểm kèm +07:00 để test cho kết quả giống nhau trên mọi máy.
const vn = (s) => new Date(`${s}+07:00`);

test('GWT-14 luồng đúng: THAP, thứ Hai 05/10 10:00 -> thứ Hai 12/10 10:00', () => {
  const han = tinhHanSla(vn('2026-10-05T10:00:00'), 'THAP');
  assert.equal(han.getTime(), vn('2026-10-12T10:00:00').getTime());
});

test('GWT-13 giá trị biên: CAO, thứ Sáu 02/10 09:00 -> bỏ qua cuối tuần, thứ Hai 05/10 09:00', () => {
  const han = tinhHanSla(vn('2026-10-02T09:00:00'), 'CAO');
  assert.equal(han.getTime(), vn('2026-10-05T09:00:00').getTime());
});

test('GWT-15 ngoại lệ: tiếp nhận thứ Bảy -> tính từ 08:00 thứ Hai, CAO thành thứ Ba 08:00', () => {
  const han = tinhHanSla(vn('2026-10-03T15:30:00'), 'CAO');
  assert.equal(han.getTime(), vn('2026-10-06T08:00:00').getTime());
});

test('Giá trị biên: Chủ nhật 23:59 vẫn là cuối tuần -> TRUNG_BINH thành thứ Năm 08:00', () => {
  const han = tinhHanSla(vn('2026-10-04T23:59:00'), 'TRUNG_BINH');
  assert.equal(han.getTime(), vn('2026-10-08T08:00:00').getTime());
});

test('Dữ liệu sai: mức ưu tiên lạ thì báo lỗi rõ ràng, không trả về hạn sai', () => {
  assert.throws(() => tinhHanSla(vn('2026-10-05T10:00:00'), 'KHAN_CAP'), RangeError);
});
