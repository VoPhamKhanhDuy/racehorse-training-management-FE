// MOCK ghi chú khi gỡ lệnh khóa huấn luyện — lưu localStorage (key "lockReleaseNotes"), CHƯA có API BE.
// BE đã có POST /api/vet/training-locks/{id}/release nhưng chỉ nhận { trangThai } (tình trạng sức khỏe mới) và không lưu ghi chú / người gỡ.
// TODO(BE): cho release nhận thêm { note } (≤ 300 ký tự) và trả về releasedBy (tên bác sĩ gỡ) + releaseNote trong TrainingLockDto; khi có thì bỏ file này.
// LƯU Ý: localStorage theo từng trình duyệt.
import { sharedStorage } from "./sharedStorage";

const STORE_KEY = "lockReleaseNotes";
export const RELEASE_NOTE_MAX = 300;

function readAll() {
  try {
    const raw = sharedStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// map lockId → { note, byName, at }
export function getLockReleaseNotes() {
  return readAll();
}

export function saveLockReleaseNote(lockId, note, byName) {
  try {
    sharedStorage.setItem(STORE_KEY, JSON.stringify({ ...readAll(), [lockId]: { note: note.trim(), byName, at: new Date().toISOString() } }));
  } catch {
    // bỏ qua
  }
}
