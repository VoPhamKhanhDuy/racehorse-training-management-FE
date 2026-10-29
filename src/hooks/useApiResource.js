import { useEffect, useState } from "react";

// Gọi API theo khóa: key đổi → gọi lại load(); key = null → không gọi (vd chưa chọn ngựa).
// key là chuỗi đại diện cho tham số của lần gọi (vd `${horseId}|${weekStart}`).
// Trả về:
// - data / error / loading của khóa hiện tại (loading suy ra từ kết quả đang giữ có khớp khóa không — không setState
//   đồng bộ trong effect)
// - reload(): gọi lại, hiện trạng thái đang tải (nút "Thử lại")
// - refresh(): gọi lại ngầm, giữ dữ liệu cũ tới khi có dữ liệu mới (sau khi sửa / xóa 1 dòng)
// - setData(value | updater): cập nhật tại chỗ bằng dữ liệu API vừa trả về (vd giáo án sau khi Áp dụng)
export default function useApiResource(load, key) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState({ key: undefined, data: undefined, error: null });
  const requestKey = key === null || key === undefined ? null : `${key}#${reloadCount}`;

  useEffect(() => {
    if (requestKey === null) return undefined;
    let ignore = false;
    load().then(
      (data) => {
        if (!ignore) setState({ key: requestKey, data, error: null });
      },
      (error) => {
        if (!ignore) setState({ key: requestKey, data: undefined, error });
      }
    );
    return () => {
      ignore = true;
    };
    // load là hàm tạo mới mỗi lần render; requestKey đã đại diện cho tham số của lần gọi nên chỉ phụ thuộc requestKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const isCurrent = requestKey !== null && state.key === requestKey;

  const refresh = () => {
    const keyAtCall = requestKey;
    if (keyAtCall === null) return Promise.resolve();
    return load().then(
      (data) => setState((prev) => (prev.key === keyAtCall ? { key: keyAtCall, data, error: null } : prev)),
      () => {
        // giữ dữ liệu cũ khi tải ngầm lỗi
      }
    );
  };

  const setData = (valueOrUpdater) =>
    setState((prev) => ({
      ...prev,
      data: typeof valueOrUpdater === "function" ? valueOrUpdater(prev.data) : valueOrUpdater,
    }));

  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : null,
    loading: requestKey !== null && !isCurrent,
    reload: () => setReloadCount((count) => count + 1),
    refresh,
    setData,
  };
}
