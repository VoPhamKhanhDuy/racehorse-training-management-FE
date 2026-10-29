import { statusDisplayLabel } from "../utils/statusLabels";

// Trạng thái dạng chữ font-semibold, không nền/viền. Màu theo mã trạng thái của giáo án / buổi tập.
const STATUS_COLORS = {
  Active: "text-[#4d6b2a]",
  InProgress: "text-[#4d6b2a]",
  Completed: "text-[#6b6055]",
  Cancelled: "text-[#b3473f]",
  Draft: "text-[#6b6055]",
  Planned: "text-[#6b6055]",
  Scheduled: "text-[#6b6055]",
};

// kind="session": bảng màu riêng cho trạng thái BUỔI TẬP (Đã lên lịch vàng, Đang tập cam, Hoàn thành olive, Đã hủy nâu nhạt)
const SESSION_STATUS_COLORS = {
  Scheduled: "text-[#b7791f]",
  InProgress: "text-[#c2570c]",
  Completed: "text-[#4d6b2a]",
  Cancelled: "text-[#8a7f6e]",
};

export default function StatusText({ code, children, kind }) {
  const colors = kind === "session" ? { ...STATUS_COLORS, ...SESSION_STATUS_COLORS } : STATUS_COLORS;
  return (
    <span className={`text-sm font-semibold whitespace-nowrap ${colors[code] ?? "text-[#6b6055]"}`}>
      {statusDisplayLabel(code, children)}
    </span>
  );
}
