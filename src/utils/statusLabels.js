// Chỉ đổi nhãn HIỂN THỊ của các mã chưa có nhãn tiếng Việt; dữ liệu và so sánh vẫn dùng mã gốc.
const DISPLAY_LABELS = { Draft: "Nháp", Planned: "Đã lên kế hoạch" };

export function statusDisplayLabel(code, fallback) {
  return DISPLAY_LABELS[code] ?? fallback ?? code;
}
