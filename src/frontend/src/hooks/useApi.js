// useApi – giữ ba trạng thái { data, loading, error } cho một lệnh gọi API, kèm hàm tải lại (nút Thử lại).
import { useCallback, useEffect, useState } from 'react';

export function useApi(goiApi, phuThuoc = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [lan, setLan] = useState(0);

  useEffect(() => {
    let huy = false;
    setState({ data: null, loading: true, error: null });
    goiApi()
      .then((data) => { if (!huy) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!huy) setState({ data: null, loading: false, error }); });
    return () => { huy = true; }; // tránh cập nhật sau khi màn hình đã đóng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...phuThuoc, lan]);

  const taiLai = useCallback(() => setLan((n) => n + 1), []);
  return { ...state, taiLai };
}
