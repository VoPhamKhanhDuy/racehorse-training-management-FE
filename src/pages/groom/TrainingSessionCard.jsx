import { CalendarCheck } from "lucide-react";
import { sessionState, sessionStateColor, sessionStateLabel } from "../../utils/sessionReview";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

// Vạch trái 3px theo cường độ (màu dịu). Trạng thái: mặc định xám, chỉ Đã xong / Đang diễn ra / Đã hủy mới có màu
const INTENSITY_BORDER = { Recovery: "border-l-[#7a9a52]", Low: "border-l-[#b9ab90]", Medium: "border-l-[#c2570c]", High: "border-l-[#c0262d]" };

// 1 buổi tập trong ô ngày của lưới tuần (chỉ xem). label(group, code): nhãn tiếng Việt từ useTrainingOptions.
// record: báo cáo / đánh giá của buổi (MOCK); onOpen: bấm thẻ → khung "Báo cáo buổi tập" (chưa báo cáo: form; đã báo cáo: xem).
export default function TrainingSessionCard({ session, record, label, onOpen }) {
  const state = sessionState(session, record);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(session)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(session);
        }
      }}
      className={`cursor-pointer min-w-0 rounded-[4px] border border-l-[3px] border-[#d9cfba] bg-white p-2.5 transition-colors hover:border-[#b9ab90] ${
        INTENSITY_BORDER[session.intensityLevel] ?? "border-l-[#b9ab90]"
      }`}
    >
      <p className="text-[15px] font-semibold text-[#2b2118] tabular-nums">
        {session.startTime}
        {session.endTime && <span className="text-[13px] font-normal text-[#6b6055]"> – {session.endTime}</span>}
      </p>
      <p className="font-serif text-[15px] font-semibold break-words text-[#2b2118]">{session.horseName}</p>
      <p className="text-sm break-words text-[#2b2118]">{session.sessionTitle}</p>
      <p className="mt-1 text-[13px] break-words text-[#6b6055]">
        {label("trainingTypes", session.trainingType)} · {label("surfaces", session.surface)} · {formatKm(session.distanceKm)} ·{" "}
        {formatMinutes(session.durationMinutes)}
      </p>
      <p className="mt-1 text-[13px]">
        <span className="font-semibold text-[#2b2118]">{label("intensityLevels", session.intensityLevel)}</span>
        <span className="text-[#6b6055]"> · </span>
        <span className={`font-semibold ${sessionStateColor(state)}`}>{sessionStateLabel(state)}</span>
      </p>

      {session.notes && (
        <p className="mt-1.5 flex gap-1.5 text-[13px] text-[#2b2118]">
          <CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6b6055]" aria-hidden="true" />
          <span className="min-w-0 break-words">Dặn dò: {session.notes}</span>
        </p>
      )}
    </div>
  );
}
