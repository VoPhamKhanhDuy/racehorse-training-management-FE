// Flow 4 gọi API /api/groom. Phiếu việc, chuồng, khẩu phần và báo cáo sự cố nằm trên máy chủ.
import { apiRequest } from "./apiClient";
import { getHorses } from "./horseService";
import incidentReports from "../data/incidentReports";
import { HEALTH_INCIDENT_TYPES, INCIDENT_DESCRIPTION_MAX, INCIDENT_STATUS } from "../data/incidentOptions";
import { toISODateTime } from "../utils/date";
import { createPersistedList } from "./persistedStore";
import { getUsers } from "./accountService";
import { toUserID } from "../utils/userId";

export { getHorses };

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function asDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function mapTask(raw) {
  return {
    TaskID: Number(pick(raw, "taskID", "TaskID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    GroomID: Number(pick(raw, "groomID", "GroomID")),
    LoaiViec: pick(raw, "loaiViec", "LoaiViec") ?? "",
    TrangThai: Boolean(pick(raw, "trangThai", "TrangThai")),
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
    Gio: pick(raw, "gio", "Gio") ?? "",
  };
}

function mapStable(raw) {
  return {
    StableID: Number(pick(raw, "stableID", "StableID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    SoChuong: pick(raw, "soChuong", "SoChuong") ?? "",
    LichSinhHoat: pick(raw, "lichSinhHoat", "LichSinhHoat") ?? "",
  };
}

function mapMeal(raw) {
  return {
    FeedID: Number(pick(raw, "feedID", "FeedID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    NguCoc: Number(pick(raw, "nguCoc", "NguCoc") ?? 0),
    Co: Number(pick(raw, "co", "Co") ?? 0),
    Vitamin: Number(pick(raw, "vitamin", "Vitamin") ?? 0),
    Bua: pick(raw, "bua", "Bua") ?? "",
  };
}

function mapReport(raw) {
  return {
    ReportID: Number(pick(raw, "reportID", "ReportID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    GroomID: Number(pick(raw, "groomID", "GroomID")),
    LoaiSuCo: pick(raw, "loaiSuCo", "LoaiSuCo") ?? "",
    MoTa: pick(raw, "moTa", "MoTa") ?? "",
    HinhAnh: pick(raw, "hinhAnh", "HinhAnh") ?? "",
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
  };
}

export async function getStableAssignments() {
  const rows = await apiRequest("/groom/stables");
  return (rows ?? []).map(mapStable);
}

export async function getFeedingPlans() {
  const rows = await apiRequest("/groom/feeding");
  return (rows ?? []).map(mapMeal);
}

export async function getStableNumbers() {
  const rows = await getStableAssignments();
  return Object.fromEntries(rows.map((s) => [s.HorseID, s.SoChuong]));
}

export async function getCareTasks() {
  const rows = await apiRequest("/groom/tasks");
  return (rows ?? []).map(mapTask);
}

export async function completeCareTask(taskId) {
  const saved = await apiRequest(`/groom/tasks/${Number(taskId)}/complete`, { method: "POST" });
  return mapTask(saved);
}

export async function getIncidentReports() {
  const rows = await apiRequest("/groom/incidents");
  return (rows ?? []).map(mapReport);
}

export async function createIncidentReport(data) {
  const saved = await apiRequest("/groom/incidents", {
    method: "POST",
    body: {
      horseID: Number(data.HorseID),
      loaiSuCo: data.LoaiSuCo,
      moTa: (data.MoTa ?? "").trim(),
      hinhAnh: data.HinhAnh || null,
      ngay: data.Ngay,
    },
  });
  return mapReport(saved);
}

// ---- Xử lý sự cố (Club Manager / Bác sĩ thú y): CHƯA có API, tạm dùng mock lưu bền trong localStorage ----
// TODO: thay bằng gọi API thật khi BE có endpoint xử lý sự cố.
const NETWORK_DELAY_MS = 400;

function delay(ms = NETWORK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const reportList = createPersistedList("incidentReports", incidentReports, "ReportID");
const reportStore = reportList.items;

// Bản ghi cũ chưa có trường xử lý → mặc định "Mới", chưa ai xử lý
const withHandling = (r) => ({
  ...r,
  TrangThai: r.TrangThai ?? INCIDENT_STATUS.NEW,
  GhiChuXuLy: r.GhiChuXuLy ?? "",
  HandledBy: r.HandledBy ?? null,
  HandledAt: r.HandledAt ?? null,
});

// Mọi báo cáo sự cố (cho Club Manager xem), mới → cũ theo Ngay, kèm tên ngựa, tên người báo và người xử lý ("—" nếu không tra được).
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

// Sự cố sức khỏe ngựa (Vết thương, Khập khiễng, Bỏ ăn) cho Bác sĩ thú y, mới → cũ theo Ngay, kèm tên ngựa / người báo / người xử lý.
export async function getIncidentsForVet() {
  const all = await getAllIncidentReports();
  return all.filter((r) => HEALTH_INCIDENT_TYPES.includes(r.LoaiSuCo));
}

// Bác sĩ thú y đổi trạng thái / ghi chú xử lý sự cố sức khỏe ngựa: Mới → Đang xử lý → Đã xử lý (không bỏ qua bước, không quay lại).
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
