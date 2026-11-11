// MOCK yêu cầu bổ sung vật tư (Groom gửi → Quản lý xử lý) — lưu localStorage key "supplyRequests", CHƯA có API BE.
// Bản ghi: { id, supplyId, supplyName, unit, quantity, note, requestedBy, requestedAt: "YYYY-MM-DD", status: "Chờ xử lý" | "Đã xử lý", handledAt, handledBy }.
// TODO(BE): nối API khi có endpoint — POST /api/supplies/{id}/restock-requests (Groom gửi), GET /api/supplies/restock-requests (Quản lý xem),
// POST /api/supplies/restock-requests/{id}/handle (Quản lý đánh dấu đã xử lý). Chưa trừ / cộng kho.
// LƯU Ý: localStorage theo từng trình duyệt — Groom và Quản lý phải dùng cùng trình duyệt khi demo.
import { todayISO } from "../utils/date";
import { sharedStorage } from "./sharedStorage";

const STORE_KEY = "supplyRequests";
const CHANGED_EVENT = "supplyRequests:changed";
export const REQUEST_NOTE_MAX = 300;
export const REQUEST_STATUS = { PENDING: "Chờ xử lý", DONE: "Đã xử lý" };

function readAll() {
  try {
    const list = JSON.parse(sharedStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    sharedStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    // bỏ qua
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function subscribeSupplyRequests(callback) {
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

// Mới nhất trước
export async function listSupplyRequests() {
  return readAll().sort((a, b) => b.requestedAt.localeCompare(a.requestedAt) || b.id.localeCompare(a.id));
}

export async function createSupplyRequest({ supplyId, supplyName, unit, quantity, note, requestedBy }) {
  if (readAll().some((r) => r.supplyId === supplyId && r.status === REQUEST_STATUS.PENDING)) {
    throw new Error("Vật tư này đã có yêu cầu đang chờ xử lý.");
  }
  const record = {
    id: `SR${Date.now()}`,
    supplyId,
    supplyName,
    unit: unit ?? "",
    quantity: Number(quantity),
    note: (note ?? "").trim(),
    requestedBy,
    requestedAt: todayISO(),
    status: REQUEST_STATUS.PENDING,
    handledAt: null,
    handledBy: null,
  };
  writeAll([...readAll(), record]);
  return record;
}

export async function markSupplyRequestDone(id, handledBy) {
  writeAll(readAll().map((r) => (r.id === id ? { ...r, status: REQUEST_STATUS.DONE, handledAt: todayISO(), handledBy } : r)));
}
