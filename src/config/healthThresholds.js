// Ngưỡng cảnh báo sức khỏe — đổi ở đây là màn Tổng quan sức khỏe (và các màn dùng utils/healthAlerts.js) đổi theo
export const HEALTH_THRESHOLDS = {
  maxHeartRate: 195, // bpm — buổi tập có NhipTim vượt mức này thì cảnh báo
  recheckDaysTreating: 7, // ngựa "Đang điều trị" quá số ngày này chưa khám lại → cần tái khám
  recheckDaysWatching: 14, // ngựa "Cần theo dõi" quá số ngày này chưa khám → nhắc khám
  vaccineDueSoonDays: 7, // vắc-xin "Chờ tiêm" đến hạn trong số ngày tới
  recentSessionDays: 7, // chỉ xét buổi tập trong số ngày gần đây
};
