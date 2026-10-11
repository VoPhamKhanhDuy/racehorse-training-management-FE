// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Nhân viên chăm sóc: công việc hằng ngày (CARETASK). Dữ liệu giữ trong bộ nhớ của module
// (mất khi tải lại trang, giống chưa có DB).
import careTasks from "../data/careTasks";
import stableAssignments from "../data/stableAssignments";
import feedingPlans from "../data/feedingPlans";
import incidentReports from "../data/incidentReports";
import { INCIDENT_DESCRIPTION_MAX, INCIDENT_TYPES } from "../data/incidentOptions";
import { todayISO } from "../utils/date";
import { getHorses } from "./horseService";

export { getHorses };

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const taskStore = careTasks.map((t) => ({ ...t }));
const reportStore = incidentReports.map((r) => ({ ...r }));

// Phân chuồng đầy đủ (STABLEASSIGNMENT: StableID, HorseID, SoChuong, LichSinhHoat)
export async function getStableAssignments() {
  await delay();
  return stableAssignments.map((s) => ({ ...s }));
}

// Kế hoạch khẩu phần (FEEDINGPLAN) của mọi ngựa
export async function getFeedingPlans() {
  await delay();
  return feedingPlans.map((f) => ({ ...f }));
}

// Số chuồng của từng ngựa (STABLEASSIGNMENT): { [HorseID]: "A1" }
export async function getStableNumbers() {
  await delay(0);
  return Object.fromEntries(stableAssignments.map((s) => [s.HorseID, s.SoChuong]));
}

// Công việc của 1 nhân viên (GroomID), mới → cũ theo Ngay; không truyền groomId thì lấy tất cả
export async function getCareTasks(groomId) {
  await delay();
  const tasks = groomId ? taskStore.filter((t) => t.GroomID === Number(groomId)) : taskStore;
  return tasks.map((t) => ({ ...t })).sort((a, b) => b.Ngay.localeCompare(a.Ngay) || a.TaskID - b.TaskID);
}

// Xác nhận xong 1 việc: TrangThai = true. Không có thao tác hoàn tác. Ràng buộc (BE cũng phải kiểm tra lại):
// chỉ nhân viên được giao (GroomID) mới xác nhận được; việc đã xong thì không xác nhận lại.
export async function completeCareTask(taskId, groomId) {
  await delay();
  const task = taskStore.find((t) => t.TaskID === Number(taskId));
  if (!task) throw new Error("Không tìm thấy công việc");
  if (task.GroomID !== Number(groomId)) throw new Error("Bạn chỉ được xác nhận công việc của chính mình");
  if (task.TrangThai) throw new Error("Công việc này đã được xác nhận");
  task.TrangThai = true;
  return { ...task };
}

// Báo cáo sự cố (INCIDENTREPORT) do 1 nhân viên gửi, mới → cũ theo Ngay
export async function getIncidentReports(groomId) {
  await delay();
  return reportStore
    .filter((r) => r.GroomID === Number(groomId))
    .map((r) => ({ ...r }))
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.ReportID - a.ReportID);
}

// Gửi báo cáo sự cố: GroomID luôn là người đang đăng nhập. Không có sửa/xóa sau khi gửi.
// HinhAnh: ở mock là data URL (base64) của ảnh đã chọn; thực tế FE upload ảnh lên server rồi lưu URL trả về.
// Ràng buộc (BE cũng phải kiểm tra lại): có ngựa, loại sự cố hợp lệ, mô tả ≤ 300 ký tự, ngày không ở tương lai.
export async function createIncidentReport(data, groomId) {
  await delay();
  const moTa = (data.MoTa ?? "").trim();
  if (!data.HorseID) throw new Error("Vui lòng chọn ngựa.");
  if (!INCIDENT_TYPES.includes(data.LoaiSuCo)) throw new Error("Loại sự cố không hợp lệ.");
  if (moTa.length > INCIDENT_DESCRIPTION_MAX) throw new Error(`Mô tả tối đa ${INCIDENT_DESCRIPTION_MAX} ký tự.`);
  if (!data.Ngay || data.Ngay > todayISO()) throw new Error("Ngày không được ở tương lai.");
  const report = {
    ReportID: reportStore.reduce((max, r) => Math.max(max, r.ReportID), 0) + 1,
    HorseID: Number(data.HorseID),
    GroomID: Number(groomId),
    LoaiSuCo: data.LoaiSuCo,
    MoTa: moTa,
    HinhAnh: data.HinhAnh ?? "",
    Ngay: data.Ngay,
  };
  reportStore.push(report);
  return { ...report };
}
