// Flow 4 gọi API /api/groom. Phiếu việc, chuồng, khẩu phần và báo cáo sự cố nằm trên máy chủ.
import { apiRequest } from "./apiClient";
import { getHorses } from "./horseService";

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
