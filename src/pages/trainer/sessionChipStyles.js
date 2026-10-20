// Màu chip buổi tập theo trạng thái — dùng ở lưới Lịch tập (ScheduleWeekGrid) và chú giải màu (Schedule)
const CHIP_STYLES = {
  Scheduled: "border border-brass/50 bg-white text-ink hover:border-brass hover:bg-brass/10",
  InProgress: "border border-[#4373a3]/50 bg-[#4373a3]/10 text-[#4373a3] hover:border-[#4373a3]",
  Completed: "border border-green-700/25 bg-green-50 text-green-800 hover:border-green-700/50",
  Cancelled: "border border-transparent bg-stone/10 text-stone line-through hover:border-stone/30",
};

export const CHIP_STATUSES = ["Scheduled", "InProgress", "Completed", "Cancelled"];

export function chipClass(status) {
  return CHIP_STYLES[status] ?? CHIP_STYLES.Scheduled;
}
