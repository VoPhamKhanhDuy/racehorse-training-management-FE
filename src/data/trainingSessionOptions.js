// Đơn vị + giới hạn hợp lệ cho TRAININGSESSION — form, danh sách, biểu đồ và service dùng chung
export const SESSION_UNITS = {
  NhipTim: "bpm",
  VanToc: "km/h",
};

export const SESSION_LIMITS = {
  NhipTim: { min: 40, max: 260 },
  VanToc: { min: 0, max: 80 },
  ChiSoTap: { min: 0, max: 100 }, // chỉ số tập thang 0–100
  NhanXetMaxLength: 300,
};
