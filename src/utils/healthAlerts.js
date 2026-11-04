// Tính việc cần xử lý về sức khỏe cho từng ngựa — hàm thuần, không gọi API, để màn Bác sĩ thú y,
// HLV trưởng, Chủ ngựa dùng lại. Chỉ dùng NGÀY khám (không cần chẩn đoán/phác đồ) nên không lộ bệnh án.
// Ngưỡng đọc từ config/healthThresholds.js.
import { HEALTH_THRESHOLDS } from "../config/healthThresholds";
import { addDays, daysSince, formatDayMonth, todayISO } from "./date";

// Loại việc, theo thứ tự ưu tiên (số nhỏ = ưu tiên cao)
export const ALERT_TYPES = {
  RECHECK_TREATING: 1, // Đang điều trị, lâu chưa tái khám
  VACCINE_OVERDUE: 2, // Vắc-xin quá hạn
  HIGH_HEART_RATE: 3, // Nhịp tim vượt ngưỡng ở buổi tập gần đây
  RECHECK_WATCHING: 4, // Cần theo dõi, lâu chưa khám
  VACCINE_DUE_SOON: 5, // Vắc-xin sắp đến hạn
};

// Trạng thái HIỂN THỊ của 1 lịch tiêm (VACCINATIONSCHEDULE chỉ lưu "Chờ tiêm" | "Đã tiêm"):
// "Đã tiêm"; "Quá hạn" = Chờ tiêm mà NgayHen đã qua; "Sắp tới" = Chờ tiêm, NgayHen trong vaccineDueSoonDays ngày tới;
// còn lại "Chờ tiêm". Mọi trang (lịch tiêm, tổng quan, hồ sơ HLV) dùng chung hàm này.
export function getVaccineState(item, today = todayISO(), thresholds = HEALTH_THRESHOLDS) {
  if (item.TrangThai === "Đã tiêm") return "Đã tiêm";
  if (item.NgayHen < today) return "Quá hạn";
  if (item.NgayHen <= addDays(today, thresholds.vaccineDueSoonDays)) return "Sắp tới";
  return "Chờ tiêm";
}

export function isVaccineOverdue(vaccination, today = todayISO()) {
  return getVaccineState(vaccination, today) === "Quá hạn";
}

// Các việc của 1 ngựa (chưa sắp xếp). input:
// - health: bản ghi HEALTHSTATUS (có thể undefined); latestExamDate: "YYYY-MM-DD" | undefined
// - vaccinations, sessions: bản ghi của riêng ngựa này; today: "YYYY-MM-DD"
function alertsForHorse({ health, latestExamDate, vaccinations, sessions, today, thresholds }) {
  const alerts = [];
  const daysSinceExam = latestExamDate ? daysSince(latestExamDate) : null;
  const examText = (days) => (days === null ? "chưa có lần khám nào" : `lần khám gần nhất cách đây ${days} ngày`);

  const treating = health?.TrangThai === "Đang điều trị" || health?.TrangThai === "Chấn thương" || health?.TrangThai === "Cách ly";
  if (treating && (daysSinceExam === null || daysSinceExam > thresholds.recheckDaysTreating)) {
    alerts.push({ type: ALERT_TYPES.RECHECK_TREATING, message: `Cần tái khám: ${examText(daysSinceExam)}.` });
  }

  const overdue = vaccinations.filter((v) => isVaccineOverdue(v, today)).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen))[0];
  if (overdue) {
    alerts.push({ type: ALERT_TYPES.VACCINE_OVERDUE, message: `Vắc-xin ${overdue.Loai} quá hạn ${daysSince(overdue.NgayHen)} ngày.` });
  }

  // Buổi tập gần đây có nhịp tim cao nhất vượt ngưỡng
  const sessionStart = addDays(today, -thresholds.recentSessionDays);
  const peak = sessions
    .filter((s) => s.Ngay >= sessionStart && s.Ngay <= today && s.NhipTim > thresholds.maxHeartRate)
    .sort((a, b) => b.NhipTim - a.NhipTim || b.Ngay.localeCompare(a.Ngay))[0];
  if (peak) {
    alerts.push({
      type: ALERT_TYPES.HIGH_HEART_RATE,
      message: `Nhịp tim ${peak.NhipTim} bpm vượt ngưỡng ${thresholds.maxHeartRate} bpm ở buổi tập ${formatDayMonth(peak.Ngay)}.`,
    });
  }

  if (health?.TrangThai === "Cần theo dõi" && (daysSinceExam === null || daysSinceExam > thresholds.recheckDaysWatching)) {
    alerts.push({
      type: ALERT_TYPES.RECHECK_WATCHING,
      message: daysSinceExam === null ? "Cần theo dõi, chưa có lần khám nào." : `Cần theo dõi, chưa khám ${daysSinceExam} ngày.`,
    });
  }

  const dueSoon = vaccinations
    .filter((v) => getVaccineState(v, today, thresholds) === "Sắp tới")
    .sort((a, b) => a.NgayHen.localeCompare(b.NgayHen))[0];
  if (dueSoon) {
    alerts.push({ type: ALERT_TYPES.VACCINE_DUE_SOON, message: `Vắc-xin ${dueSoon.Loai} đến hạn ngày ${formatDayMonth(dueSoon.NgayHen)}.` });
  }

  return alerts.sort((a, b) => a.type - b.type);
}

// Danh sách việc cần xử lý: mỗi ngựa gộp thành 1 việc ưu tiên cao nhất (+ số việc khác), sắp theo ưu tiên rồi tên ngựa.
// data: { horses, healthStatuses, latestExamDates: { [HorseID]: "YYYY-MM-DD" }, vaccinations, sessions, today }
// Trả [{ horse, alert: { type, message }, otherCount }]
export function getHealthAlerts({ horses, healthStatuses, latestExamDates, vaccinations, sessions, today }, thresholds = HEALTH_THRESHOLDS) {
  return horses
    .map((horse) => {
      const alerts = alertsForHorse({
        health: healthStatuses.find((h) => h.HorseID === horse.HorseID),
        latestExamDate: latestExamDates[horse.HorseID],
        vaccinations: vaccinations.filter((v) => v.HorseID === horse.HorseID),
        sessions: sessions.filter((s) => s.HorseID === horse.HorseID),
        today,
        thresholds,
      });
      return alerts.length ? { horse, alert: alerts[0], otherCount: alerts.length - 1 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.alert.type - b.alert.type || a.horse.Ten.localeCompare(b.horse.Ten, "vi"));
}
