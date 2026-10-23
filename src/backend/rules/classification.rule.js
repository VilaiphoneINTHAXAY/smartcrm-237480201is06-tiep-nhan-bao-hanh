// Quy tắc BR-04: phân loại nhóm sự cố theo từ khóa trong mô tả lỗi (GWT-11, GWT-12).
// Hàm thuần: danh mục nhóm được truyền vào (service đọc từ bảng issue_category),
// nên test được mà không cần CSDL.

const TEN_NHOM_KHAC = 'Khác';

// Chuẩn hoá để so khớp: chữ thường + cùng một dạng mã Unicode (NFC).
// Lý do: chữ tiếng Việt gõ từ hai bộ gõ khác nhau có thể ra hai chuỗi byte khác nhau
// dù nhìn giống hệt ("à" dựng sẵn và "a" + dấu huyền).
function chuanHoa(chuoi) {
  return String(chuoi).normalize('NFC').toLowerCase();
}

/**
 * Phân loại một mô tả lỗi vào nhóm sự cố (BR-04).
 *
 * @param {string} moTaLoi  Mô tả lỗi khách hàng nói.
 * @param {Array<{id: number, name: string, keywords: string,
 *                default_priority: string, match_order: number}>} danhMuc
 *        Các dòng của bảng issue_category; keywords cách nhau bằng dấu phẩy.
 * @returns {{categoryId: number|null, tenNhom: string, mucUuTien: string}}
 *   Xét nhóm theo match_order tăng dần, khớp nhóm ĐẦU TIÊN thì dừng.
 *   Không khớp nhóm nào -> nhóm "Khác", mức TRUNG_BINH (GWT-12).
 */
function phanLoai(moTaLoi, danhMuc) {
  const moTa = chuanHoa(moTaLoi);
  const sapXep = [...danhMuc].sort((a, b) => a.match_order - b.match_order);

  for (const nhom of sapXep) {
    const tuKhoa = nhom.keywords
      .split(',')
      .map((k) => chuanHoa(k).trim())
      .filter((k) => k.length > 0); // nhóm "Khác" có keywords rỗng -> không bao giờ khớp ở đây
    if (tuKhoa.some((k) => moTa.includes(k))) {
      return { categoryId: nhom.id ?? null, tenNhom: nhom.name, mucUuTien: nhom.default_priority };
    }
  }

  // GWT-12: không khớp nhóm nào.
  const khac = danhMuc.find((n) => n.name === TEN_NHOM_KHAC);
  return { categoryId: khac ? khac.id : null, tenNhom: TEN_NHOM_KHAC, mucUuTien: 'TRUNG_BINH' };
}

module.exports = { phanLoai };
