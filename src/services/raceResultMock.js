// TẠM THỜI, chờ BE cấp quyền cho endpoint lưu kết quả giải (PUT /races/{id}/registrations/{horseId}/result và /prize trả 403 với cả
// Trainer lẫn Manager); XÓA FILE NÀY + chỗ gọi trong raceService.js khi BE xong.
// Kết quả bị 403 được giữ ở localStorage "raceResults": [{ raceId, horseId, thuHang, tienThuong, syncedToBE }].
// Chỉ bản ghi syncedToBE:false được phủ lên dữ liệu BE (vì mới hơn); đã đồng bộ thì BE là nguồn chính.
const KEY = "raceResults";

function readAll() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // localStorage đầy / bị chặn: bỏ qua, kết quả chỉ không được giữ cục bộ
  }
}

const sameKey = (a, b) => Number(a.raceId) === Number(b.raceId) && Number(a.horseId) === Number(b.horseId);

export const listUnsyncedResults = () => readAll().filter((r) => !r.syncedToBE);

export function saveLocalResult({ raceId, horseId, thuHang, tienThuong }) {
  const record = { raceId: Number(raceId), horseId: Number(horseId), thuHang, tienThuong: tienThuong ?? null, syncedToBE: false };
  writeAll([...readAll().filter((r) => !sameKey(r, record)), record]);
  return record;
}

export function markResultSynced(raceId, horseId) {
  writeAll(readAll().map((r) => (sameKey(r, { raceId, horseId }) ? { ...r, syncedToBE: true } : r)));
}

// Phủ kết quả cục bộ chưa đồng bộ lên danh sách đăng ký từ BE; bản ghi được phủ có localOnly: true
export function applyLocalResults(registrations) {
  const pending = listUnsyncedResults();
  if (pending.length === 0) return registrations;
  return registrations.map((reg) => {
    const local = pending.find((r) => sameKey(r, { raceId: reg.RaceID, horseId: reg.HorseID }));
    return local ? { ...reg, ThuHang: local.thuHang, TienThuong: local.tienThuong, localOnly: true } : reg;
  });
}
