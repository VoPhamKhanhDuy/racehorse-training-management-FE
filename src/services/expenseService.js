// TODO: thay bằng gọi API thật khi BE xong
// Mock API chi phí (bảng EXPENSE): Quản lý CLB thêm / sửa / xóa ở /manager/finance, chủ ngựa chỉ XEM ở /owner/finance —
// cùng 1 kho nên chủ ngựa thấy ngay (sau reload) thay đổi của Quản lý.
// Lưu bền: SEED (data/expenses.js) + lớp thay đổi trong localStorage (services/persistedStore.js); id mới từ 1000.
import expenses from "../data/expenses";
import { EXPENSE_NOTE_MAX, EXPENSE_TYPES } from "../data/expenseOptions";
import { createPersistedList } from "./persistedStore";
import { todayISO } from "../utils/date";

const NETWORK_DELAY_MS = 400;
const NEW_ID_START = 1000;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const expenseList = createPersistedList("expenses", expenses, "ExpenseID");

const nextExpenseId = () => Math.max(NEW_ID_START - 1, ...expenseList.items.map((e) => e.ExpenseID)) + 1;

// Chuẩn hóa + kiểm tra — BE cũng phải kiểm tra lại: ngựa có; loại hợp lệ; số tiền nguyên > 0; ngày không ở tương lai; ghi chú ≤ 120
function toExpenseRecord(data) {
  const record = {
    HorseID: Number(data.HorseID),
    LoaiChiPhi: data.LoaiChiPhi,
    SoTien: Number(data.SoTien),
    Ngay: data.Ngay,
    GhiChu: (data.GhiChu ?? "").trim().replace(/\s+/g, " "),
  };
  if (!record.HorseID) throw new Error("Vui lòng chọn ngựa");
  if (!EXPENSE_TYPES.includes(record.LoaiChiPhi)) throw new Error("Loại chi phí không hợp lệ");
  if (!Number.isInteger(record.SoTien) || record.SoTien <= 0) throw new Error("Số tiền phải là số nguyên lớn hơn 0");
  if (!record.Ngay || record.Ngay > todayISO()) throw new Error("Ngày không được ở tương lai");
  if (record.GhiChu.length > EXPENSE_NOTE_MAX) throw new Error(`Ghi chú tối đa ${EXPENSE_NOTE_MAX} ký tự`);
  return record;
}

// Chi phí của các ngựa (không truyền = tất cả), mới nhất trước (cùng ngày thì khoản ghi sau trước)
export async function getExpenses(horseIds) {
  await delay();
  const ids = horseIds ? new Set(horseIds.map(Number)) : null;
  return expenseList.items
    .filter((e) => !ids || ids.has(e.HorseID))
    .map((e) => ({ ...e }))
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.ExpenseID - a.ExpenseID);
}

export async function createExpense(data) {
  await delay();
  const expense = { ExpenseID: nextExpenseId(), ...toExpenseRecord(data) };
  expenseList.items.push(expense);
  expenseList.save();
  return { ...expense };
}

export async function updateExpense(expenseId, data) {
  await delay();
  const expense = expenseList.items.find((e) => e.ExpenseID === Number(expenseId));
  if (!expense) throw new Error("Không tìm thấy khoản chi phí");
  Object.assign(expense, toExpenseRecord(data));
  expenseList.save();
  return { ...expense };
}

export async function deleteExpense(expenseId) {
  await delay();
  const expense = expenseList.items.find((e) => e.ExpenseID === Number(expenseId));
  if (!expense) throw new Error("Không tìm thấy khoản chi phí");
  expenseList.remove((e) => e.ExpenseID === Number(expenseId));
  return { ...expense };
}
