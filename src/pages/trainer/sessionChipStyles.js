// Màu thẻ buổi tập theo trạng thái — dùng ở lưới Lịch tập (ScheduleWeekGrid) và chú giải màu (Schedule).
// Thẻ: nền nhạt + vạch trái 3px đặc, không viền bao ngoài; hover đậm hơn 1 chút cùng họ màu.
const CHIP_STYLES = {
  Scheduled: "border-l-[3px] border-l-[#b7791f] bg-[#fdf6e7] text-[#7a5228] hover:bg-[#f9ebc9]",
  InProgress: "border-l-[3px] border-l-[#c2570c] bg-[#fbeee2] text-[#8a3f0a] hover:bg-[#f7dfc9]",
  Completed: "border-l-[3px] border-l-[#4d6b2a] bg-[#eef3e2] text-[#3f5420] hover:bg-[#e1ebcd]",
  Cancelled: "border-l-[3px] border-l-[#8a7f6e] bg-[#efece6] text-[#6b6055] hover:bg-[#e6e1d8]",
};

// Màu đặc của ô vuông trong chú giải (cùng màu vạch trái của thẻ)
const SWATCH_STYLES = {
  Scheduled: "bg-[#b7791f]",
  InProgress: "bg-[#c2570c]",
  Completed: "bg-[#4d6b2a]",
  Cancelled: "bg-[#8a7f6e]",
};

export const CHIP_STATUSES = ["Scheduled", "InProgress", "Completed", "Cancelled"];

export function chipClass(status) {
  return CHIP_STYLES[status] ?? CHIP_STYLES.Scheduled;
}

export function swatchClass(status) {
  return SWATCH_STYLES[status] ?? SWATCH_STYLES.Scheduled;
}
