// M1 – Tạo phiếu bảo hành (UC01, UC02 include UC03–UC05 · FR-01…FR-05, FR-07, FR-08)
// Bố cục theo wireframe-M1 của BT1: trái = 1. Khách hàng · 2. Thiết bị · 3. Mô tả lỗi; phải = Kết quả sau khi lưu.
import { useState } from 'react';
import { customersApi } from '../api/customers.api';
import { ticketsApi } from '../api/tickets.api';
import { thoiGian, TEN_TRANG_THAI, TEN_BAO_HANH } from '../components/format';

const MAY_TRONG = { modelName: '', imei: '', serialNo: '', purchaseDate: '', warrantyMonths: 12 };

export default function ReceiveDevicePage({ moPhieu }) {
  const [phone, setPhone] = useState('');
  const [tra, setTra] = useState({ loading: false, error: null, khach: null, khongThay: false });
  const [moFormKhach, setMoFormKhach] = useState(false);
  const [tenKhachMoi, setTenKhachMoi] = useState('');
  const [chon, setChon] = useState('');            // id thiết bị đã đăng ký, hoặc 'new'
  const [mayMoi, setMayMoi] = useState(MAY_TRONG);
  const [moTa, setMoTa] = useState('');
  const [luu, setLuu] = useState({ loading: false, error: null });
  const [ketQua, setKetQua] = useState(null);      // phiếu vừa tạo -> khung "Kết quả sau khi lưu"

  const khach = tra.khach;
  const mayDaChon = khach?.devices.find((d) => String(d.id) === chon);
  const loi = (ten) => luu.error?.fields?.[ten];

  async function traCuu(e) {
    e?.preventDefault();
    setTra({ loading: true, error: null, khach: null, khongThay: false });
    setMoFormKhach(false);
    try {
      const k = await customersApi.traCuu(phone.trim());
      setTra({ loading: false, error: null, khach: k, khongThay: false });
      setChon(k.devices.length ? String(k.devices[0].id) : 'new');
    } catch (err) {
      // GWT-02 (UC02-1a): SĐT chưa có -> báo + cho tạo khách mới; khác với lỗi hệ thống
      if (err.code === 'KHONG_TIM_THAY') setTra({ loading: false, error: null, khach: null, khongThay: true });
      else setTra({ loading: false, error: err, khach: null, khongThay: false });
    }
  }

  async function taoKhach() {
    setTra((s) => ({ ...s, loading: true, error: null }));
    try {
      const k = await customersApi.tao(tenKhachMoi.trim(), phone.trim());
      setTra({ loading: false, error: null, khach: { ...k, devices: [] }, khongThay: false });
      setMoFormKhach(false);
      setChon('new');
    } catch (err) {
      setTra((s) => ({ ...s, loading: false, error: err }));
    }
  }

  async function luuPhieu(e) {
    e.preventDefault();
    setLuu({ loading: true, error: null });
    const payload = { issueDescription: moTa };
    if (chon === 'new') {
      payload.device = {
        customerId: khach.id,
        modelName: mayMoi.modelName,
        imei: mayMoi.imei || null,
        serialNo: mayMoi.serialNo || null,
        purchaseDate: mayMoi.purchaseDate || null, // để trống = CHƯA XÁC MINH (GWT-09)
        warrantyMonths: Number(mayMoi.warrantyMonths),
      };
    } else {
      payload.deviceId = Number(chon);
    }
    try {
      const phieu = await ticketsApi.tiepNhan(payload);
      setKetQua(phieu);
      setLuu({ loading: false, error: null });
      setMoTa('');
      // Thiết bị mới vừa lưu đã thành thiết bị của khách: tải lại để lần sau chọn được
      if (chon === 'new') { setMayMoi(MAY_TRONG); traCuu(); }
    } catch (err) {
      setLuu({ loading: false, error: err });
    }
  }

  function huy() {
    setPhone(''); setTra({ loading: false, error: null, khach: null, khongThay: false });
    setChon(''); setMayMoi(MAY_TRONG); setMoTa(''); setLuu({ loading: false, error: null }); setKetQua(null);
  }

  // Ô của thiết bị: máy đã đăng ký -> chỉ xem; máy mới -> nhập
  const o = (ten, giaTri, props = {}) => (
    <input value={giaTri ?? ''} readOnly={chon !== 'new'} disabled={!khach}
      onChange={(e) => setMayMoi({ ...mayMoi, [ten]: e.target.value })} {...props} />
  );
  const tb = chon === 'new' ? mayMoi : {
    modelName: mayDaChon?.model_name, imei: mayDaChon?.imei, serialNo: mayDaChon?.serial_no,
    purchaseDate: mayDaChon?.purchase_date || '', warrantyMonths: mayDaChon?.warranty_months,
  };

  return (
    <section>
      <h1>M1 – Tạo phiếu bảo hành</h1>
      <div className="m1">
        <form className="m1-left" onSubmit={luuPhieu}>
          <fieldset className="box">
            <legend>1. Khách hàng</legend>
            <div className="form-row">
              <label htmlFor="sdt">Số điện thoại</label>
              <input id="sdt" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" inputMode="tel" />
              <button type="button" className="btn-outline" onClick={traCuu} disabled={tra.loading || !phone.trim()}>
                {tra.loading ? 'Đang tìm…' : 'Tra cứu'}
              </button>
            </div>
            {khach && <p>Họ tên khách: <strong>{khach.full_name}</strong></p>}
            {tra.khongThay && (
              <div className="form-row">
                <p className="alert-inline">⚠ Không tìm thấy khách hàng với SĐT này (UC02-1a)</p>
                <button type="button" className="btn-outline" onClick={() => setMoFormKhach(true)}>+ Tạo khách hàng mới</button>
              </div>
            )}
            {moFormKhach && (
              <div className="form-row">
                <label htmlFor="ten">Họ tên khách</label>
                <input id="ten" value={tenKhachMoi} onChange={(e) => setTenKhachMoi(e.target.value)} />
                <button type="button" className="btn-dark" onClick={taoKhach} disabled={!tenKhachMoi.trim()}>Lưu khách</button>
              </div>
            )}
            {tra.error && (
              <div className="state state-error" role="alert">
                <p>{tra.error.message}</p><button type="button" className="btn-outline" onClick={traCuu}>Thử lại</button>
              </div>
            )}
          </fieldset>

          <fieldset className="box" disabled={!khach}>
            <legend>2. Thiết bị</legend>
            <div className="form-row">
              <label htmlFor="tb">Thiết bị của khách</label>
              <select id="tb" value={chon} onChange={(e) => setChon(e.target.value)} className="wide">
                {!khach && <option value="">— tra cứu khách trước —</option>}
                {khach?.devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.model_name} – {d.imei ? `IMEI ${d.imei}` : `Serial ${d.serial_no}`}</option>
                ))}
                {khach && <option value="new">+ Thiết bị mới</option>}
              </select>
            </div>
            <div className="form-row"><label>Model</label>{o('modelName', tb.modelName)}</div>
            {loi('modelName') && <p className="field-error indent">{loi('modelName')}</p>}
            <div className="form-row"><label>IMEI</label>{o('imei', tb.imei, { inputMode: 'numeric' })}
              <span className="hint">Nhập IMEI hoặc Serial<br />(Serial: 5–30 ký tự chữ/số)</span></div>
            {loi('imei') && <p className="field-error indent">{loi('imei')} (UC02-3a)</p>}
            <div className="form-row"><label>Serial</label>{o('serialNo', tb.serialNo)}</div>
            {loi('serialNo') && <p className="field-error indent">{loi('serialNo')}</p>}
            <div className="form-row">
              <label>Ngày mua</label>{o('purchaseDate', tb.purchaseDate, { type: 'date' })}
              <label className="inline">Số tháng bảo hành</label>
              {o('warrantyMonths', tb.warrantyMonths, { type: 'number', min: 0, max: 60, className: 'short' })}
            </div>
            {loi('purchaseDate') && <p className="field-error indent">{loi('purchaseDate')} (UC02-3b)</p>}
            {loi('warrantyMonths') && <p className="field-error indent">{loi('warrantyMonths')}</p>}
          </fieldset>

          <fieldset className="box" disabled={!khach}>
            <legend>3. Mô tả lỗi</legend>
            <textarea rows="3" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Màn hình không lên nguồn sau khi sạc…" />
            {loi('issueDescription') && <p className="field-error">{loi('issueDescription')} (UC02-3c)</p>}
          </fieldset>

          {luu.error && !Object.keys(luu.error.fields || {}).length && <p className="field-error" role="alert">{luu.error.message}</p>}
          <div className="actions">
            <button type="button" className="btn-outline" onClick={huy}>Hủy</button>
            <button type="submit" className="btn-dark" disabled={!khach || luu.loading}>{luu.loading ? 'Đang lưu…' : 'Lưu phiếu'}</button>
          </div>
        </form>

        <aside className="box result">
          <h2>Kết quả sau khi lưu (UC03–UC05)</h2>
          {[
            ['Mã phiếu', ketQua?.code, true],
            ['Trạng thái phiếu', ketQua && TEN_TRANG_THAI[ketQua.status]],
            ['Tình trạng bảo hành', ketQua && TEN_BAO_HANH[ketQua.warrantyStatus]],
            ['Nhóm sự cố', ketQua?.categoryName],
            ['Mức ưu tiên', ketQua?.priority, true],
            ['Thời điểm tiếp nhận', ketQua && thoiGian(ketQua.receivedAt)],
            ['Hạn SLA', ketQua && thoiGian(ketQua.slaDueAt)],
          ].map(([nhan, giaTri, dam]) => (
            <div className="kv" key={nhan}><span>{nhan}</span><span className={`val${dam ? ' bold' : ''}`}>{giaTri || '—'}</span></div>
          ))}
          {ketQua && <p><button className="link" onClick={() => moPhieu(ketQua.id)}>Xem chi tiết phiếu {ketQua.code} (M3) →</button></p>}
          <ul className="notes">
            <li>Thiếu ngày mua → CHƯA XÁC MINH + cờ “chưa xác minh bảo hành” (FR-05)</li>
            <li>Tiếp nhận T7/CN → SLA tính từ 08:00 thứ Hai (UC05-1a)</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
