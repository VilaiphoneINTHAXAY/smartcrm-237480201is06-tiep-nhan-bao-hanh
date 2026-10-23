// M1 – Tạo phiếu bảo hành (UC01, UC02, UC03 · FR-01…04, FR-07, FR-08)
import { useState } from 'react';
import { customersApi } from '../api/customers.api';
import { ticketsApi } from '../api/tickets.api';

const MAY_MOI = { modelName: '', imei: '', serialNo: '', purchaseDate: '', warrantyMonths: 12 };

export default function ReceiveDevicePage({ moPhieu }) {
  const [phone, setPhone] = useState('');
  const [traCuu, setTraCuu] = useState({ loading: false, error: null, khach: null, khongThay: false });
  const [tenKhachMoi, setTenKhachMoi] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [mayMoi, setMayMoi] = useState(MAY_MOI);
  const [moTa, setMoTa] = useState('');
  const [gui, setGui] = useState({ loading: false, error: null });

  async function timKhach(e) {
    e?.preventDefault();
    setTraCuu({ loading: true, error: null, khach: null, khongThay: false });
    setDeviceId('');
    try {
      const khach = await customersApi.traCuu(phone.trim());
      setTraCuu({ loading: false, error: null, khach, khongThay: false });
      if (khach.devices.length) setDeviceId(String(khach.devices[0].id));
      else setDeviceId('new');
    } catch (err) {
      // GWT-02: SĐT chưa có -> báo và cho tạo khách mới (khác với lỗi hệ thống)
      if (err.code === 'KHONG_TIM_THAY') setTraCuu({ loading: false, error: null, khach: null, khongThay: true });
      else setTraCuu({ loading: false, error: err, khach: null, khongThay: false });
    }
  }

  async function taoKhach() {
    setTraCuu((s) => ({ ...s, loading: true, error: null }));
    try {
      const k = await customersApi.tao(tenKhachMoi.trim(), phone.trim());
      setTraCuu({ loading: false, error: null, khach: { ...k, devices: [] }, khongThay: false });
      setDeviceId('new');
    } catch (err) {
      setTraCuu((s) => ({ ...s, loading: false, error: err }));
    }
  }

  async function taoPhieu(e) {
    e.preventDefault();
    setGui({ loading: true, error: null });
    const payload = { issueDescription: moTa };
    if (deviceId === 'new') {
      payload.device = {
        customerId: traCuu.khach.id,
        modelName: mayMoi.modelName,
        imei: mayMoi.imei || null,
        serialNo: mayMoi.serialNo || null,
        purchaseDate: mayMoi.purchaseDate || null, // để trống = chưa xác minh (GWT-09)
        warrantyMonths: Number(mayMoi.warrantyMonths),
      };
    } else {
      payload.deviceId = Number(deviceId);
    }
    try {
      const phieu = await ticketsApi.tiepNhan(payload);
      moPhieu(phieu.id); // tạo xong -> sang M3 xem phiếu
    } catch (err) {
      setGui({ loading: false, error: err });
    }
  }

  const loiTruong = (ten) => gui.error?.fields?.[ten];
  const khach = traCuu.khach;

  return (
    <section>
      <h1>M1 · Tạo phiếu bảo hành</h1>

      <form className="card row" onSubmit={timKhach}>
        <label className="grow">Số điện thoại khách
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="vd 0901234567" inputMode="tel" required />
        </label>
        <button type="submit" disabled={traCuu.loading}>{traCuu.loading ? 'Đang tìm…' : 'Tra cứu'}</button>
      </form>

      {traCuu.error && (
        <div className="state state-error" role="alert">
          <p>{traCuu.error.message}</p>
          <button onClick={timKhach}>Thử lại</button>
        </div>
      )}

      {traCuu.khongThay && (
        <div className="card">
          <p><strong>Không tìm thấy khách hàng với SĐT này.</strong> Nhập họ tên để tạo khách mới.</p>
          <div className="row">
            <input className="grow" value={tenKhachMoi} onChange={(e) => setTenKhachMoi(e.target.value)} placeholder="Họ tên khách" />
            <button onClick={taoKhach} disabled={!tenKhachMoi.trim()}>Tạo khách hàng mới</button>
          </div>
        </div>
      )}

      {khach && (
        <form className="card" onSubmit={taoPhieu}>
          <p>Khách: <strong>{khach.full_name}</strong> · {khach.phone}</p>

          <label>Thiết bị
            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {khach.devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.model_name} · {d.imei || d.serial_no} · {d.purchase_date ? `mua ${d.purchase_date}` : 'chưa có ngày mua'}
                </option>
              ))}
              <option value="new">+ Thiết bị mới</option>
            </select>
          </label>

          {deviceId === 'new' && (
            <fieldset>
              <legend>Thiết bị mới</legend>
              <label>Dòng máy<input value={mayMoi.modelName} onChange={(e) => setMayMoi({ ...mayMoi, modelName: e.target.value })} /></label>
              {loiTruong('modelName') && <p className="field-error">{loiTruong('modelName')}</p>}
              <div className="row">
                <label className="grow">IMEI (15 số)<input value={mayMoi.imei} onChange={(e) => setMayMoi({ ...mayMoi, imei: e.target.value })} inputMode="numeric" /></label>
                <label className="grow">hoặc Serial<input value={mayMoi.serialNo} onChange={(e) => setMayMoi({ ...mayMoi, serialNo: e.target.value })} /></label>
              </div>
              {(loiTruong('imei') || loiTruong('serialNo')) && <p className="field-error">{loiTruong('imei') || loiTruong('serialNo')}</p>}
              <div className="row">
                <label className="grow">Ngày mua (để trống nếu khách không nhớ)
                  <input type="date" value={mayMoi.purchaseDate} onChange={(e) => setMayMoi({ ...mayMoi, purchaseDate: e.target.value })} />
                </label>
                <label>Số tháng BH
                  <input type="number" min="0" max="60" value={mayMoi.warrantyMonths} onChange={(e) => setMayMoi({ ...mayMoi, warrantyMonths: e.target.value })} />
                </label>
              </div>
              {loiTruong('purchaseDate') && <p className="field-error">{loiTruong('purchaseDate')}</p>}
            </fieldset>
          )}

          <label>Mô tả lỗi
            <textarea rows="3" value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="vd: Màn hình bị sọc sau khi rơi" />
          </label>
          {loiTruong('issueDescription') && <p className="field-error">{loiTruong('issueDescription')}</p>}

          {gui.error && !Object.keys(gui.error.fields || {}).length && (
            <p className="field-error" role="alert">{gui.error.message}</p>
          )}
          <button type="submit" disabled={gui.loading}>{gui.loading ? 'Đang tạo phiếu…' : 'Tạo phiếu'}</button>
          <p className="muted">Hệ thống tự kiểm tra bảo hành, phân loại nhóm sự cố và tính hạn SLA khi lưu.</p>
        </form>
      )}
    </section>
  );
}
