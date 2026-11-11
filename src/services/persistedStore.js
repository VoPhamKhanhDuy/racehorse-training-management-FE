// Kho dữ liệu lưu bền trên SQL Server thông qua sharedStorage (/api/shared-state) theo 2 lớp:
// - SEED: mảng hằng số trong src/data/*.js.
// - OVERLAY (sharedStorage trên BE): phần phát sinh khi dùng app — bản ghi mới, bản ghi seed đã bị sửa, id seed đã bị xóa.
// Mọi tab, cửa sổ Ẩn danh và trình duyệt khác luôn nhìn thấy cùng dữ liệu ngay lập tức.
import { SEED_VERSION } from "../data/seedVersion";
import { sharedStorage, subscribeSharedStorage } from "./sharedStorage";

const DATA_PREFIX = "equitrack.data.";
const DATA_VERSION_KEY = "equitrack.dataSeedVersion";

// Mọi key do lớp mock tạo ra (dùng cho nút "Reset dữ liệu demo")
const DEMO_KEYS = [
  "equitrack.userData",
  "equitrack.seedVersion",
  "equitrack.users",
  DATA_VERSION_KEY,
  "financePayments",
  "sessionReviews",
  "supplyRequests",
  "careLogs",
  "lockReleaseNotes",
  "raceResults",
];

function ensureVersion() {
  try {
    const savedVer = sharedStorage.getItem(DATA_VERSION_KEY);
    if (savedVer === String(SEED_VERSION)) return;
    if (savedVer !== null) {
      sharedStorage
        .keys()
        .filter((key) => key.startsWith(DATA_PREFIX))
        .forEach((key) => sharedStorage.removeItem(key));
    }
    sharedStorage.setItem(DATA_VERSION_KEY, String(SEED_VERSION));
  } catch {
    // bỏ qua
  }
}

// Xóa mọi dữ liệu demo đã lưu trên BE để về đúng SEED. Phiên đăng nhập (sessionStorage) giữ nguyên.
export function clearDemoData() {
  try {
    sharedStorage
      .keys()
      .filter((key) => key.startsWith(DATA_PREFIX) || DEMO_KEYS.includes(key))
      .forEach((key) => sharedStorage.removeItem(key));
    sharedStorage.clearAllServerState();
  } catch {
    // bỏ qua
  }
}

// name: tên kho; seed: mảng seed; idField: tên cột id hoặc hàm (item) => khóa (khóa ghép).
export function createPersistedList(name, seed, idField) {
  ensureVersion();
  const key = DATA_PREFIX + name;
  const idOf = typeof idField === "function" ? idField : (item) => item[idField];
  const seedById = new Map(seed.map((item) => [idOf(item), item]));

  function readOverlay() {
    try {
      const raw = sharedStorage.getItem(key);
      const saved = raw ? JSON.parse(raw) : null;
      return {
        upserts: Array.isArray(saved?.upserts) ? saved.upserts : [],
        deleted: Array.isArray(saved?.deleted) ? saved.deleted : [],
      };
    } catch {
      return { upserts: [], deleted: [] };
    }
  }

  function buildMergedItems() {
    const overlay = readOverlay();
    const deleted = new Set(overlay.deleted);
    const overrides = new Map(overlay.upserts.map((item) => [idOf(item), item]));
    return [
      ...seed.filter((s) => !deleted.has(idOf(s))).map((s) => ({ ...(overrides.get(idOf(s)) ?? s) })),
      ...overlay.upserts.filter((u) => !seedById.has(idOf(u))).map((u) => ({ ...u })),
    ];
  }

  const items = buildMergedItems();

  function refreshFromStorage() {
    const merged = buildMergedItems();
    items.splice(0, items.length, ...merged);
  }

  subscribeSharedStorage((changedKey) => {
    if (changedKey === null || changedKey === key) {
      refreshFromStorage();
    }
  });

  // Ghi overlay: bản ghi mới + bản ghi seed đã khác seed + id seed không còn trong items (đã xóa)
  function save() {
    const present = new Set(items.map(idOf));
    const upserts = items.filter((item) => {
      const original = seedById.get(idOf(item));
      return !original || JSON.stringify(original) !== JSON.stringify(item);
    });
    const removed = [...seedById.keys()].filter((id) => !present.has(id));
    try {
      sharedStorage.setItem(key, JSON.stringify({ upserts, deleted: removed }));
    } catch {
      // bỏ qua
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
