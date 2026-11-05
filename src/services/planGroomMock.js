// MOCK: Groom được chọn lúc Trainer "Áp dụng" kế hoạch — lưu localStorage (key "planGroomAssignments"), CHƯA có API BE.
// BE hiện: POST /api/trainer/training-plans/{id}/activate KHÔNG nhận người thực hiện; chỉ POST …/weekly-schedule (xếp lịch tuần) và
// POST …/sessions (thêm buổi tập) nhận assignedToUserId. Nên FE nhớ Groom đã chọn ở bước Áp dụng và dùng làm người được giao mặc định
// khi xếp lịch tuần. TODO(BE): cho activate nhận { assignedToUserId } (lưu theo giáo án) để các buổi sinh ra tự giao cho Groom đó.
const STORE_KEY = "planGroomAssignments";
const LAST_KEY = "lastGroomUserId";

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage bị chặn → bỏ qua (mock chỉ phục vụ demo)
  }
}

// Groom đã chọn cho giáo án { userId, fullName } hoặc null
export function getPlanGroom(planId) {
  return read(STORE_KEY, {})[planId] ?? null;
}

export function setPlanGroom(planId, groom) {
  write(STORE_KEY, { ...read(STORE_KEY, {}), [planId]: { userId: groom.userId, fullName: groom.fullName } });
  write(LAST_KEY, groom.userId);
}

// Groom được chọn gần nhất (mặc định cho lần Áp dụng sau)
export function getLastGroomUserId() {
  return read(LAST_KEY, null);
}
