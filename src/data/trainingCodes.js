// Danh mục mã của luồng giáo án huấn luyện — khớp BE (SWP.Domain/Common). Nguồn chính là
// GET /api/trainer/training-plans/options (hooks/useTrainingOptions.js); bản tĩnh này dùng khi API chưa trả về / lỗi,
// hoặc với role không gọi được API đó (nhân viên chăm sóc).

// Cường độ từ nhẹ đến nặng — so sánh "không vượt mức cho phép" theo thứ tự này
export const INTENSITY_ORDER = ["Recovery", "Low", "Medium", "High"];

export const TRAINING_CODE_FALLBACK = {
  intensityLevels: [
    { code: "Recovery", label: "Phục hồi" },
    { code: "Low", label: "Nhẹ" },
    { code: "Medium", label: "Trung bình" },
    { code: "High", label: "Cao" },
  ],
  trainingTypes: [
    { code: "Walk", label: "Đi bộ", intensityLevel: "Recovery", defaultSurface: "Sand" },
    { code: "Swimming", label: "Bơi", intensityLevel: "Recovery", defaultSurface: "Pool" },
    { code: "Trot", label: "Nước kiệu", intensityLevel: "Low", defaultSurface: "Sand" },
    { code: "Canter", label: "Phi chậm (canter)", intensityLevel: "Medium", defaultSurface: "Dirt" },
    { code: "Interval", label: "Chạy biến tốc", intensityLevel: "High", defaultSurface: "Dirt" },
    { code: "Gallop", label: "Phi nước đại", intensityLevel: "High", defaultSurface: "Turf" },
    { code: "TrialRun", label: "Chạy thử", intensityLevel: "High", defaultSurface: "Turf" },
  ],
  surfaces: [
    { code: "Turf", label: "Sân cỏ" },
    { code: "Dirt", label: "Sân đất" },
    { code: "Sand", label: "Sân cát" },
    { code: "Synthetic", label: "Sân tổng hợp" },
    { code: "Pool", label: "Hồ bơi" },
  ],
  planTypes: [
    { code: "Conditioning", label: "Thể lực nền" },
    { code: "Endurance", label: "Sức bền" },
    { code: "Speed", label: "Tốc độ" },
    { code: "RacePreparation", label: "Chuẩn bị thi đấu" },
    { code: "Rehabilitation", label: "Phục hồi chấn thương" },
  ],
  planStatuses: [
    { code: "Draft", label: "Nháp" },
    { code: "Active", label: "Đang áp dụng" },
    { code: "Completed", label: "Hoàn thành" },
    { code: "Cancelled", label: "Đã hủy" },
  ],
  sessionStatuses: [
    { code: "Scheduled", label: "Đã lên lịch" },
    { code: "InProgress", label: "Đang tập" },
    { code: "Completed", label: "Hoàn thành" },
    { code: "Cancelled", label: "Đã hủy" },
  ],
};

// Mặt sân "Pool" chỉ dùng cho bài "Swimming" và ngược lại
export const POOL_SURFACE = "Pool";
export const SWIMMING_TYPE = "Swimming";

// Giới hạn nhập liệu — khớp quy tắc BE (docs/API_GiaoAn_HuanLuyen.md mục 6.4, 6.11, 7.7, 7.8)
export const PLAN_RULES = {
  planNameMax: 150,
  objectiveMax: 500,
  notesMax: 1000,
  phaseNameMax: 100,
  phaseGoalMax: 500,
  maxPhases: 12,
  maxTotalDays: 366,
  sessionsPerWeek: { min: 1, max: 6 },
  distanceKmMax: 15,
  durationMinutes: { min: 5, max: 240 },
  suggestionWeeks: { min: 1, max: 26, default: 8 },
};

export const SESSION_RULES = {
  distanceKmMax: 15,
  durationMinutes: { min: 5, max: 240 },
  titleMax: 150,
  notesMax: 1000,
  maxPerDay: 2,
  cancelReasonMax: 450,
};

export const RESULT_RULES = {
  actualDistanceKmMax: 50,
  actualDurationMinutes: { min: 1, max: 300 },
  performanceScore: { min: 0, max: 10 },
  heartRate: { min: 20, max: 260 },
  avgSpeedKmhMax: 80,
  resultMax: 500,
  trainerCommentMax: 1000,
  trialVideoUrlMax: 500,
};

// Khoảng ngày tối đa của 1 lần tra cứu buổi tập
export const SESSION_QUERY_MAX_DAYS = 62;
