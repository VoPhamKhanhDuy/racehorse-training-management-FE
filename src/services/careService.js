// TODO: thay bằng gọi API thật khi BE xong
// Mock API cho Nhân viên chăm sóc: công việc hằng ngày (CARETASK). Dữ liệu giữ trong bộ nhớ của module
// (mất khi tải lại trang, giống chưa có DB).
import careTasks from "../data/careTasks";
import stableAssignments from "../data/stableAssignments";
import feedingPlans from "../data/feedingPlans";
import incidentReports from "../data/incidentReports";
import { HEALTH_INCIDENT_TYPES, INCIDENT_DESCRIPTION_MAX, INCIDENT_STATUS, INCIDENT_TYPES } from "../data/incidentOptions";
import { toISODateTime, todayISO } from "../utils/date";
import { getHorses } from "./horseService";
import { createPersistedList } from "./persistedStore";
import { getUsers } from "./accountService";
import { toUserID } from "../utils/userId";

export { getHorses };

const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lưu bền: SEED + lớp thay đổi trong localStorage (services/persistedStore.js)
const taskList = createPersistedList("careTasks", careTasks, "TaskID");
const reportList = createPersistedList("incidentReports", incidentReports, "ReportID");
const stableList = createPersistedList("stableAssignments", stableAssignments, "StableID");
const feedingList = createPersistedList("feedingPlans", feedingPlans, "FeedID");
const taskStore = taskList.items;
const reportStore = reportList.items;

// Phân chuồng đầy đủ (STABLEASSIGNMENT: StableID, HorseID, SoChuong, LichSinhHoat)
export async function getStableAssignments() {
  await delay();
  return stableList.items.map((s) => ({ ...s }));
}

// Kế hoạch khẩu phần (FEEDINGPLAN) của mọi ngựa
export async function getFeedingPlans() {
  await delay();
  return feedingList.items.map((f) => ({ ...f }));
}

// Số chuồng của từng ngựa (STABLEASSIGNMENT): { [HorseID]: "A1" }
export async function getStableNumbers() {
  await delay(0);
  return Object.fromEntries(stableList.items.map((s) => [s.HorseID, s.SoChuong]));
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
  taskList.save();
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

// Bản ghi cũ chưa có trường xử lý → mặc định "Mới", chưa ai xử lý
const withHandling = (r) => ({
  ...r,
  TrangThai: r.TrangThai ?? INCIDENT_STATUS.NEW,
  GhiChuXuLy: r.GhiChuXuLy ?? "",
  HandledBy: r.HandledBy ?? null,
  HandledAt: r.HandledAt ?? null,
});

// Mọi báo cáo sự cố (cho Club Manager xem), mới → cũ theo Ngay, kèm tên ngựa, tên người báo và người xử lý ("—" nếu không tra được).
// Khi có API thật, BE trả sẵn HorseName/ReporterName/HandlerName → chỉ cần thay phần bên trong hàm này.
export async function getAllIncidentReports() {
  const [horses, users] = await Promise.all([getHorses(), getUsers(), delay()]);
  const horseNames = Object.fromEntries(horses.map((h) => [h.HorseID, h.Ten]));
  const userNames = Object.fromEntries(users.map((u) => [toUserID(u.id), u.fullName]));
  return reportStore
    .map((r) => {
      const report = withHandling(r);
      return {
        ...report,
        HorseName: horseNames[r.HorseID] ?? "—",
        ReporterName: userNames[r.GroomID] ?? "—",
        HandlerName: report.HandledBy ? (userNames[report.HandledBy] ?? "—") : null,
      };
    })
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.ReportID - a.ReportID);
}

// Manager đổi trạng thái / ghi chú xử lý. Ràng buộc (BE cũng phải kiểm tra lại): chỉ sự cố chuồng/thiết bị và "Khác"
// (sự cố sức khỏe ngựa do bác sĩ thú y xử lý), trạng thái hợp lệ, đã xử lý thì không đổi nữa.
export async function updateIncidentStatus(reportId, { TrangThai, GhiChuXuLy }, userId) {
  await delay();
  const report = reportStore.find((r) => r.ReportID === Number(reportId));
  if (!report) throw new Error("Không tìm thấy báo cáo sự cố");
  if (HEALTH_INCIDENT_TYPES.includes(report.LoaiSuCo)) throw new Error("Sự cố sức khỏe ngựa do bác sĩ thú y xử lý.");
  if (![INCIDENT_STATUS.IN_PROGRESS, INCIDENT_STATUS.DONE].includes(TrangThai)) throw new Error("Trạng thái không hợp lệ.");
  if (report.TrangThai === INCIDENT_STATUS.DONE) throw new Error("Sự cố này đã được xử lý.");
  const note = (GhiChuXuLy ?? "").trim();
  if (note.length > INCIDENT_DESCRIPTION_MAX) throw new Error(`Ghi chú tối đa ${INCIDENT_DESCRIPTION_MAX} ký tự.`);
  Object.assign(report, { TrangThai, GhiChuXuLy: note, HandledBy: Number(userId), HandledAt: toISODateTime(new Date()) });
  reportList.save();
  return withHandling(report);
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
    TrangThai: INCIDENT_STATUS.NEW,
    GhiChuXuLy: "",
    HandledBy: null,
    HandledAt: null,
  };
  reportStore.push(report);
  reportList.save();
  return { ...report };
}

// Sự cố sức khỏe ngựa (Vết thương, Khập khiễng, Bỏ ăn) cho Bác sĩ thú y, mới → cũ theo Ngay, kèm tên ngựa / người báo / người xử lý.
// Khi có API thật chỉ cần thay phần bên trong hàm này.
export async function getIncidentsForVet() {
  const all = await getAllIncidentReports();
  return all.filter((r) => HEALTH_INCIDENT_TYPES.includes(r.LoaiSuCo));
}

// Bác sĩ thú y đổi trạng thái / ghi chú xử lý sự cố sức khỏe ngựa: Mới → Đang xử lý → Đã xử lý (không bỏ qua bước, không quay lại).
// (updateIncidentStatus ở trên dành cho Manager và từ chối loại sức khỏe nên không dùng lại được.)
// Ràng buộc (BE cũng phải kiểm tra lại): đúng loại sức khỏe, đúng thứ tự trạng thái, ghi chú ≤ 300 ký tự.
export async function updateHealthIncidentStatus(reportId, { TrangThai, GhiChuXuLy }, userId) {
  await delay();
  const report = reportStore.find((r) => r.ReportID === Number(reportId));
  if (!report) throw new Error("Không tìm thấy báo cáo sự cố");
  if (!HEALTH_INCIDENT_TYPES.includes(report.LoaiSuCo)) throw new Error("Chỉ xử lý sự cố về sức khỏe ngựa.");
  const current = report.TrangThai ?? INCIDENT_STATUS.NEW;
  const nextAllowed = { [INCIDENT_STATUS.NEW]: INCIDENT_STATUS.IN_PROGRESS, [INCIDENT_STATUS.IN_PROGRESS]: INCIDENT_STATUS.DONE };
  if (nextAllowed[current] !== TrangThai) throw new Error("Không thể chuyển sang trạng thái này.");
  const note = (GhiChuXuLy ?? "").trim();
  if (note.length > INCIDENT_DESCRIPTION_MAX) throw new Error(`Ghi chú tối đa ${INCIDENT_DESCRIPTION_MAX} ký tự.`);
  Object.assign(report, { TrangThai, GhiChuXuLy: note, HandledBy: Number(userId), HandledAt: toISODateTime(new Date()) });
  reportList.save();
  return withHandling(report);
}
