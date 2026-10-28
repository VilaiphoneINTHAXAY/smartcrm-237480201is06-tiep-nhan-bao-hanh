// Kiểm thử quy tắc BR-02, BR-03 (bảo hành). Hàm thuần, không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { kiemTraBaoHanh, tinhNgayHetHan } = require('../src/backend/rules/warranty.rule');

const tb = (ngayMua, soThangBaoHanh = 12) => ({ ngayMua, soThangBaoHanh });

test('Luồng đúng: mua 15/01/2026, bảo hành 12 tháng, tiếp nhận 08/09/2026 -> CÒN bảo hành', () => {
  const r = kiemTraBaoHanh(tb('2026-01-15'), '2026-09-08');
  assert.equal(r.warrantyStatus, 'CON_BAO_HANH');
  assert.equal(r.ngayHetHan, '2027-01-15');
});

test('GWT-06 giá trị biên: tiếp nhận ĐÚNG ngày hết hạn vẫn CÒN bảo hành', () => {
  const r = kiemTraBaoHanh(tb('2025-10-23'), '2026-10-23');
  assert.equal(r.warrantyStatus, 'CON_BAO_HANH');
});

test('GWT-07 giá trị biên: tiếp nhận ngày kế tiếp sau ngày hết hạn -> HẾT bảo hành', () => {
  const r = kiemTraBaoHanh(tb('2025-10-23'), '2026-10-24');
  assert.equal(r.warrantyStatus, 'HET_BAO_HANH');
});

test('BR-02 giá trị biên: mua 31/01, bảo hành 1 tháng -> hết hạn 28/02 (cuối tháng)', () => {
  assert.equal(tinhNgayHetHan('2026-01-31', 1), '2026-02-28');
});

test('GWT-09 ngoại lệ: thiếu ngày mua -> CHƯA XÁC MINH và gắn cờ', () => {
  const r = kiemTraBaoHanh(tb(null), '2026-10-23');
  assert.deepEqual(r, { warrantyStatus: 'CHUA_XAC_MINH', isUnverified: true, ngayHetHan: null });
});

test('GWT-08 dữ liệu sai: ngày mua sau ngày tiếp nhận -> từ chối, báo đúng trường', () => {
  assert.throws(() => kiemTraBaoHanh(tb('2026-11-01'), '2026-10-23'),
    { code: 'DU_LIEU_KHONG_HOP_LE', field: 'purchaseDate' });
});
