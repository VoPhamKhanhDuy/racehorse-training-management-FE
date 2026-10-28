// Kho dữ liệu mock có LƯU BỀN (localStorage) theo 2 lớp, dùng chung cho mọi service:
// - SEED: mảng hằng số trong src/data/*.js — KHÔNG bao giờ ghi vào localStorage.
// - OVERLAY (localStorage): chỉ phần phát sinh khi dùng app — bản ghi mới, bản ghi seed đã bị sửa, id seed đã bị xóa.
// Khi tải: dữ liệu = SEED hợp nhất OVERLAY theo id (bản overlay ghi đè bản seed cùng id; id nằm trong "deleted" thì bỏ).
// Service mutate trực tiếp mảng `items` (push / Object.assign / remove) rồi gọi save() để ghi overlay.
// SEED_VERSION (data/seedVersion.js) khác bản đã lưu → xóa toàn bộ overlay để seed mới nạp lại sạch (tránh lệch id).
// LƯU Ý: chỉ để demo — BE thật thay toàn bộ lớp này.
import { SEED_VERSION } from "../data/seedVersion";

const DATA_PREFIX = "equitrack.data.";
const DATA_VERSION_KEY = "equitrack.dataSeedVersion";

// Mọi key do lớp mock tạo ra (dùng cho nút "Reset dữ liệu demo")
const DEMO_KEYS = ["equitrack.userData", "equitrack.seedVersion", "equitrack.users", DATA_VERSION_KEY, "financePayments"];

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// Chạy 1 lần khi module được nạp: khác SEED_VERSION → xóa overlay cũ
(function ensureVersion() {
  const ls = storage();
  if (!ls) return;
  try {
    if (ls.getItem(DATA_VERSION_KEY) === String(SEED_VERSION)) return;
    Object.keys(ls)
      .filter((key) => key.startsWith(DATA_PREFIX))
      .forEach((key) => ls.removeItem(key));
    ls.setItem(DATA_VERSION_KEY, String(SEED_VERSION));
  } catch {
    // bỏ qua
  }
})();

// Xóa mọi dữ liệu demo đã lưu (overlay + tài khoản tự tạo) để về đúng SEED. Phiên đăng nhập (sessionStorage) giữ nguyên.
export function clearDemoData() {
  const ls = storage();
  if (!ls) return;
  try {
    Object.keys(ls)
      .filter((key) => key.startsWith(DATA_PREFIX) || DEMO_KEYS.includes(key))
      .forEach((key) => ls.removeItem(key));
  } catch {
    // bỏ qua
  }
}

// name: tên kho (key localStorage); seed: mảng seed; idField: tên cột id hoặc hàm (item) => khóa (khóa ghép).
export function createPersistedList(name, seed, idField) {
  const key = DATA_PREFIX + name;
  const idOf = typeof idField === "function" ? idField : (item) => item[idField];
  const seedById = new Map(seed.map((item) => [idOf(item), item]));

  function readOverlay() {
    try {
      const saved = JSON.parse(storage()?.getItem(key));
      return {
        upserts: Array.isArray(saved?.upserts) ? saved.upserts : [],
        deleted: Array.isArray(saved?.deleted) ? saved.deleted : [],
      };
    } catch {
      return { upserts: [], deleted: [] };
    }
  }

  // Hợp nhất SEED + OVERLAY: không đọc "toàn bộ từ localStorage rồi bỏ seed"
  const overlay = readOverlay();
  const deleted = new Set(overlay.deleted);
  const overrides = new Map(overlay.upserts.map((item) => [idOf(item), item]));
  const items = [
    ...seed.filter((s) => !deleted.has(idOf(s))).map((s) => ({ ...(overrides.get(idOf(s)) ?? s) })),
    ...overlay.upserts.filter((u) => !seedById.has(idOf(u))).map((u) => ({ ...u })),
  ];

  // Ghi overlay: bản ghi mới + bản ghi seed đã khác seed + id seed không còn trong items (đã xóa)
  function save() {
    const present = new Set(items.map(idOf));
    const upserts = items.filter((item) => {
      const original = seedById.get(idOf(item));
      return !original || JSON.stringify(original) !== JSON.stringify(item);
    });
    const removed = [...seedById.keys()].filter((id) => !present.has(id));
    try {
      storage()?.setItem(key, JSON.stringify({ upserts, deleted: removed }));
    } catch {
      // Trình duyệt chặn / đầy bộ nhớ: vẫn chạy được, chỉ mất dữ liệu khi tải lại
    }
  }

  // Xóa các bản ghi thỏa predicate (mutate tại chỗ để mọi tham chiếu tới items vẫn đúng) rồi lưu
  function remove(predicate) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (predicate(items[i])) items.splice(i, 1);
    }
    save();
  }

  return { items, save, remove };
}
