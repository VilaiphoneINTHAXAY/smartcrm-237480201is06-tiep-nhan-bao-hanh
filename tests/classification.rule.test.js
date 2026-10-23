// Kiểm thử quy tắc BR-04 (phân loại nhóm sự cố). Danh mục giống seeds/001_demo.sql.
const test = require('node:test');
const assert = require('node:assert/strict');
const { phanLoai } = require('../src/backend/rules/classification.rule');

const DANH_MUC = [
  { id: 1, name: 'Phần cứng', keywords: 'màn hình,vỡ,không lên nguồn,pin,sạc,camera,loa', default_priority: 'CAO', match_order: 1 },
  { id: 2, name: 'Phần mềm', keywords: 'treo,đơ,lag,bootloop,lỗi ứng dụng,cập nhật', default_priority: 'TRUNG_BINH', match_order: 2 },
  { id: 3, name: 'Kết nối', keywords: 'wifi,sóng,bluetooth,sim', default_priority: 'TRUNG_BINH', match_order: 3 },
  { id: 4, name: 'Phụ kiện/Ngoại hình', keywords: 'ốp,trầy xước,nút bấm', default_priority: 'THAP', match_order: 4 },
  { id: 5, name: 'Khác', keywords: '', default_priority: 'TRUNG_BINH', match_order: 99 },
];

test('GWT-11 luồng đúng: "Máy bị TREO logo" -> Phần mềm, TRUNG_BINH (không phân biệt hoa/thường)', () => {
  const r = phanLoai('Máy bị TREO logo', DANH_MUC);
  assert.deepEqual(r, { categoryId: 2, tenNhom: 'Phần mềm', mucUuTien: 'TRUNG_BINH' });
});

test('BR-04 giá trị biên: khớp HAI nhóm thì lấy nhóm có thứ tự nhỏ hơn (Phần cứng trước Kết nối)', () => {
  const r = phanLoai('Mất sóng wifi và màn hình nhấp nháy', DANH_MUC);
  assert.equal(r.tenNhom, 'Phần cứng');
  assert.equal(r.mucUuTien, 'CAO');
});

test('GWT-12 ngoại lệ: không khớp từ khóa nào -> Khác, TRUNG_BINH', () => {
  const r = phanLoai('Khách muốn hỏi giá đổi máy', DANH_MUC);
  assert.deepEqual(r, { categoryId: 5, tenNhom: 'Khác', mucUuTien: 'TRUNG_BINH' });
});
