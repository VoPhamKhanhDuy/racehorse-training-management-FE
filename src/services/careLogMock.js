// MOCK nhật ký việc chăm sóc hằng ngày (cho ăn, dọn chuồng, chải lông…) — lưu localStorage (key "careLogs"), CHƯA có API BE.
// Khác với việc chăm sóc do BE giao (careService.completeCareTask → POST /groom/tasks/{id}/complete): việc hằng ngày ở đây TỰ SINH từ chuồng +
// khẩu phần (utils/careDailyTasks.js) nên chưa có bản ghi nào trên BE để "hoàn thành".
// LƯU Ý: localStorage theo từng trình duyệt.
const STORE_KEY = "careLogs";
const CHANGED_EVENT = "careLogs:changed";
export const CARE_NOTE_MAX = 200;

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function subscribeCareLogs(callback) {
  const onStorage = (e) => {
    if (e.key === STORE_KEY || e.key === null) callback();
  };
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// TODO: thay bằng API BE — GET /api/groom/care-tasks?date (kèm đã xong lúc nào + ghi chú). Trả map taskKey → { completedAt, note, by }.
export async function getCareLogs() {
  return readAll();
}

// TODO: thay bằng API BE — POST /api/groom/care-tasks/{key}/complete, body { note } (≤ 200 ký tự). Không hoàn tác được.
export async function completeCareTask(taskKey, note, groomName) {
  const text = (note ?? "").trim();
  if (text.length > CARE_NOTE_MAX) throw new Error(`Ghi chú tối đa ${CARE_NOTE_MAX} ký tự.`);
  const all = readAll();
  if (all[taskKey]) return all[taskKey]; // đã xong rồi → giữ nguyên
  const log = { completedAt: new Date().toISOString(), note: text, by: groomName };
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...all, [taskKey]: log }));
  } catch {
    throw new Error("Không lưu được, vui lòng thử lại.");
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
  return log;
}
