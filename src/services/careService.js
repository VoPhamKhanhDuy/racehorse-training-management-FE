// Flow 4 gọi API /api/groom. Phiếu việc, chuồng, khẩu phần và báo cáo sự cố nằm trên máy chủ.
import { apiRequest } from "./apiClient";
import { getHorses } from "./horseService";
import { FACILITY_INCIDENT_TYPES, HEALTH_INCIDENT_TYPES, INCIDENT_STATUS } from "../data/incidentOptions";

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
  const horseId = Number(pick(raw, "horseID", "HorseID"));
  const assignmentId = Number(pick(raw, "assignmentID", "AssignmentID"));
  return {
    // AssignmentID = từng ô; StableID = cả cụm chuồng (nhiều ngựa có thể chung StableID)
    AssignmentID: Number.isFinite(assignmentId) && assignmentId > 0 ? assignmentId : horseId,
    StableID: Number(pick(raw, "stableID", "StableID")),
    HorseID: horseId,
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
  const handledBy = pick(raw, "handledBy", "HandledBy");
  return {
    ReportID: Number(pick(raw, "reportID", "ReportID")),
    HorseID: Number(pick(raw, "horseID", "HorseID")),
    GroomID: Number(pick(raw, "groomID", "GroomID")),
    LoaiSuCo: pick(raw, "loaiSuCo", "LoaiSuCo") ?? "",
    MoTa: pick(raw, "moTa", "MoTa") ?? "",
    HinhAnh: pick(raw, "hinhAnh", "HinhAnh") ?? "",
    Ngay: asDate(pick(raw, "ngay", "Ngay")),
    TrangThai: pick(raw, "trangThai", "TrangThai") ?? INCIDENT_STATUS.NEW,
    GhiChuXuLy: pick(raw, "ghiChuXuLy", "GhiChuXuLy") ?? "",
    HandledBy: handledBy == null || handledBy === "" ? null : Number(handledBy),
    HandledAt: pick(raw, "handledAt", "HandledAt") ?? null,
    HorseName: pick(raw, "horseName", "HorseName") ?? "",
    ReporterName: pick(raw, "reporterName", "ReporterName") ?? "",
    HandlerName: pick(raw, "handlerName", "HandlerName") ?? null,
    SoChuong: pick(raw, "soChuong", "SoChuong") ?? "",
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

// Club Manager: xem mọi sự cố — GET /api/manager/incidents
export async function getAllIncidentReports() {
  const rows = await apiRequest("/manager/incidents");
  return (rows ?? []).map(mapReport);
}

// Manager chỉ cập nhật sự cố chuồng trại / thiết bị — POST /api/manager/incidents/{id}/status
export async function updateIncidentStatus(reportId, { TrangThai, GhiChuXuLy }) {
  const saved = await apiRequest(`/manager/incidents/${Number(reportId)}/status`, {
    method: "POST",
    body: {
      trangThai: TrangThai,
      ghiChuXuLy: (GhiChuXuLy ?? "").trim(),
    },
  });
  return mapReport(saved);
}

// Sự cố sức khỏe ngựa cho Bác sĩ thú y — GET /api/vet/incidents
// Chỉ giữ loại sức khỏe; loại trừ chuồng trại / thiết bị (dù BE đã lọc).
export async function getIncidentsForVet() {
  const rows = await apiRequest("/vet/incidents");
  return (rows ?? [])
    .map(mapReport)
    .filter((r) => HEALTH_INCIDENT_TYPES.includes(r.LoaiSuCo) && !FACILITY_INCIDENT_TYPES.includes(r.LoaiSuCo));
}

// Bác sĩ thú y đổi trạng thái: Mới → Đang xử lý → Đã xử lý — POST /api/vet/incidents/{id}/status
export async function updateHealthIncidentStatus(reportId, { TrangThai, GhiChuXuLy }) {
  const saved = await apiRequest(`/vet/incidents/${Number(reportId)}/status`, {
    method: "POST",
    body: {
      trangThai: TrangThai,
      ghiChuXuLy: (GhiChuXuLy ?? "").trim(),
    },
  });
  return mapReport(saved);
}
