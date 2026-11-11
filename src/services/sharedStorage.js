// Kho lưu trữ trạng thái dùng chung đồng bộ trực tiếp với SQL Server trên Backend (/api/shared-state).
// Thay thế hoàn toàn window.localStorage cho dữ liệu nghiệp vụ, giúp mọi Tab, cửa sổ Ẩn danh (Incognito)
// và các trình duyệt khác luôn nhìn thấy cùng một dữ liệu theo thời gian thực.

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const ENDPOINT = `${API_BASE_URL}/api/shared-state`;

const memoryStore = new Map();
const keyListeners = new Set();

const DOMAIN_EVENTS_BY_KEY = {
  sessionReviews: "sessionReviews:changed",
  supplyRequests: "supplyRequests:changed",
  careLogs: "careLogs:changed",
};

function notifyKeyChanged(key) {
  for (const listener of keyListeners) {
    try {
      listener(key);
    } catch {
      // bỏ qua lỗi listener
    }
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new StorageEvent("storage", { key }));
    } catch {
      window.dispatchEvent(new Event("storage"));
    }
    const domainEvent = key ? DOMAIN_EVENTS_BY_KEY[key] : null;
    if (domainEvent) {
      window.dispatchEvent(new Event(domainEvent));
    }
    window.dispatchEvent(new CustomEvent("sharedStorage:changed", { detail: { key } }));
  }
}

async function pushKeyToServer(key, value) {
  try {
    await fetch(`${ENDPOINT}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ value }),
    });
  } catch {
    // Máy chủ tạm thời chưa phản hồi: giữ trong bộ nhớ phiên hiện tại
  }
}

export async function syncFromServer() {
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
    if (!response.ok) return false;
    const serverMap = await response.json();
    if (!serverMap || typeof serverMap !== "object") return false;

    const changedKeys = new Set();
    const serverEntries = Object.entries(serverMap);

    for (const [key, val] of serverEntries) {
      const strVal = String(val);
      if (memoryStore.get(key) !== strVal) {
        memoryStore.set(key, strVal);
        changedKeys.add(key);
      }
    }

    for (const existingKey of [...memoryStore.keys()]) {
      if (!(existingKey in serverMap)) {
        memoryStore.delete(existingKey);
        changedKeys.add(existingKey);
      }
    }

    changedKeys.forEach((k) => notifyKeyChanged(k));
    return true;
  } catch {
    return false;
  }
}

export async function initSharedStorage() {
  await syncFromServer();

  if (typeof window !== "undefined") {
    const refreshIfVisible = () => {
      if (document.visibilityState !== "hidden") {
        syncFromServer();
      }
    };
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.setInterval(refreshIfVisible, 2500);
  }
}

export function subscribeSharedStorage(listener) {
  keyListeners.add(listener);
  return () => keyListeners.delete(listener);
}

export const sharedStorage = {
  getItem(key) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },

  setItem(key, value) {
    const strVal = String(value);
    const prev = memoryStore.get(key);
    memoryStore.set(key, strVal);
    if (prev !== strVal) {
      notifyKeyChanged(key);
    }
    pushKeyToServer(key, strVal);
  },

  removeItem(key) {
    const existed = memoryStore.delete(key);
    if (existed) {
      notifyKeyChanged(key);
    }
    pushKeyToServer(key, null);
  },

  keys() {
    return [...memoryStore.keys()];
  },

  clearAllServerState() {
    memoryStore.clear();
    notifyKeyChanged(null);
    fetch(ENDPOINT, { method: "DELETE" }).catch(() => {});
  },
};

