// ticket.validator.js – Kiểm tra ĐỊNH DẠNG dữ liệu tạo phiếu và thiết bị (chưa đụng tới CSDL).
// Kiểm tra một lần ở cửa vào (buổi 9); service nhận dữ liệu đã sạch.
const AppError = require('../errors/AppError');

const IMEI_REGEX = /^\d{15}$/;               // BR-01: IMEI đúng 15 chữ số
const SERIAL_REGEX = /^[A-Za-z0-9]{5,30}$/;  // BR-01: Serial 5–30 ký tự chữ/số
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const loi = (message, field) => new AppError('DU_LIEU_KHONG_HOP_LE', message, field);
const chuoi = (v) => (typeof v === 'string' ? v.trim() : v);

function laSoNguyenDuong(v) {
  return Number.isInteger(v) && v > 0;
}

// Thiết bị mới đi kèm phiếu (khi khách mang tới máy chưa đăng ký).
function validateDevice(input) {
  const d = input || {};
  const modelName = chuoi(d.modelName);
  const imei = chuoi(d.imei) || null;
  const serialNo = chuoi(d.serialNo) || null;
  const purchaseDate = chuoi(d.purchaseDate) || null;
  const warrantyMonths = d.warrantyMonths === undefined ? 12 : d.warrantyMonths;

  if (!laSoNguyenDuong(d.customerId)) throw loi('Thiếu khách hàng của thiết bị', 'customerId');
  if (!modelName) throw loi('Thiếu tên dòng máy', 'modelName');
  if (!imei && !serialNo) throw loi('Thiết bị phải có IMEI hoặc Serial', 'imei');
  // GWT-04: báo lỗi tại đúng trường IMEI/Serial
  if (imei && !IMEI_REGEX.test(imei)) throw loi('IMEI phải đúng 15 chữ số', 'imei');
  if (serialNo && !SERIAL_REGEX.test(serialNo)) throw loi('Serial gồm 5–30 ký tự chữ hoặc số', 'serialNo');
  if (purchaseDate && !DATE_REGEX.test(purchaseDate)) throw loi('Ngày mua có dạng YYYY-MM-DD', 'purchaseDate');
  if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 60) {
    throw loi('Số tháng bảo hành từ 0 đến 60', 'warrantyMonths');
  }
  return { customerId: d.customerId, modelName, imei, serialNo, purchaseDate, warrantyMonths };
}

// Dữ liệu tạo phiếu: hoặc deviceId (máy đã đăng ký), hoặc device (máy mới).
function validateTaoPhieu(input) {
  const d = input || {};
  const issueDescription = chuoi(d.issueDescription);
  // GWT-05
  if (!issueDescription) throw loi('Vui lòng nhập mô tả lỗi', 'issueDescription');
  if (issueDescription.length > 1000) throw loi('Mô tả lỗi tối đa 1000 ký tự', 'issueDescription');

  if (d.deviceId !== undefined) {
    if (!laSoNguyenDuong(d.deviceId)) throw loi('Mã thiết bị không hợp lệ', 'deviceId');
    // customerId (không bắt buộc): khách đang được tiếp nhận – để kiểm QT-03 ở lớp service
    if (d.customerId !== undefined && !laSoNguyenDuong(d.customerId)) throw loi('Mã khách hàng không hợp lệ', 'customerId');
    return { issueDescription, deviceId: d.deviceId, customerId: d.customerId ?? null, device: null };
  }
  if (!d.device) throw loi('Cần chọn thiết bị đã đăng ký hoặc nhập thiết bị mới', 'deviceId');
  return { issueDescription, deviceId: null, device: validateDevice(d.device) };
}

module.exports = { validateTaoPhieu, validateDevice };
