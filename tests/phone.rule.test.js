// Kiểm thử quy tắc số điện thoại của case study: QT-02 (chuẩn hoá) và QT-15 (che số). Hàm thuần, không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { chuanHoaSoDienThoai, cheSoDienThoai } = require('../src/backend/rules/phone.rule');

test('QT-02 luồng đúng: bốn dạng nhập đều quy về 0901234567', () => {
  for (const s of ['0901234567', '+84901234567', '84901234567', '090 123 4567', '090.123.4567', ' +84 90-123-4567 ']) {
    assert.equal(chuanHoaSoDienThoai(s), '0901234567', s);
  }
});

test('QT-02 dữ liệu sai: thiếu/thừa chữ số, có chữ cái, rỗng -> null (không đoán bừa)', () => {
  for (const s of ['090123456', '09012345678', '090123456a', '', '+8490123456', null]) {
    assert.equal(chuanHoaSoDienThoai(s), null, String(s));
  }
});

test('QT-15 giá trị biên: che 4 số giữa, giữ 3 số đầu và 3 số cuối', () => {
  assert.equal(cheSoDienThoai('0901234567'), '090****567');
});
