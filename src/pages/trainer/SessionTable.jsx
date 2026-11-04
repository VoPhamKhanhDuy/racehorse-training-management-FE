import { DataCell, DataRow, DataTable } from "../../components/DataTable";
import IntensityText from "../../components/IntensityText";
import StatusText from "../../components/StatusText";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDayMonth, shortWeekdayName, todayISO } from "../../utils/date";
import { formatKm, formatMinutes, formatNumber, formatTimeRange } from "../../utils/trainingFormat";

// Bảng buổi tập (TrainingSession) — bấm 1 dòng để mở ngăn chi tiết. showHorse / showPlan: thêm cột ngựa / giáo án.
// Bảng có khung (tiêu đề nâu, kẻ #d9cfba, chân "N buổi"). Buổi hôm nay chỉ nhấn bằng vạch cam 2px bên trái, không đổi nền dòng.
export default function SessionTable({ sessions, onSelect, showHorse = false, showPlan = false, emptyText = "Không có buổi tập nào." }) {
  const { label } = useTrainingOptions();
  const today = todayISO();

  if (sessions.length === 0) {
    return (
      <div className="rounded border border-[#b9ab90] bg-white py-12 text-center text-sm text-[#6b6055]">{emptyText}</div>
    );
  }

  const columns = [
    { key: "date", label: "Ngày", width: "120px" },
    showHorse && { key: "horse", label: "Ngựa", width: "140px" },
    { key: "session", label: "Buổi tập", width: "minmax(200px,2fr)" },
    { key: "intensity", label: "Cường độ", width: "110px" },
    { key: "plan", label: "Kế hoạch", width: "90px" },
    { key: "actual", label: "Thực tế", width: "90px" },
    { key: "score", label: "Điểm", width: "60px" },
    { key: "assignee", label: "Phụ trách", width: "150px" },
    { key: "status", label: "Trạng thái", width: "110px" },
  ].filter(Boolean);
  const template = columns.map((column) => column.width).join(" ");

  return (
    <DataTable columns={columns} template={template} minWidth={showHorse ? 1000 : 860} footer={`${sessions.length} buổi`} framed>
      {sessions.map((session) => {
        const cancelled = session.status === "Cancelled";
        const isToday = session.trainingDate === today;
        return (
          <DataRow
            key={session.sessionId}
            template={template}
            onClick={() => onSelect(session.sessionId)}
            className={`border-l-2 ${isToday ? "border-l-[#c2570c]" : "border-l-transparent"} ${cancelled ? "text-[#6b6055]" : ""}`}
          >
            <DataCell className="whitespace-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(session.sessionId);
                }}
                className={`cursor-pointer text-left text-[#2b2118] outline-none focus-visible:underline ${isToday ? "font-semibold" : "font-medium"}`}
              >
                {shortWeekdayName(session.trainingDate)} {formatDayMonth(session.trainingDate)}
              </button>
              <span className="block text-xs text-[#6b6055] tabular-nums">
                {isToday ? "Hôm nay · " : ""}
                {formatTimeRange(session.startTime, session.endTime)}
              </span>
            </DataCell>
            {showHorse && (
              <DataCell className="font-medium whitespace-nowrap">
                <span className="truncate">{session.horseName}</span>
              </DataCell>
            )}
            <DataCell>
              <p className={`truncate ${cancelled ? "line-through" : "text-[#2b2118]"}`}>{session.sessionTitle}</p>
              <p className="truncate text-xs text-[#6b6055]">
                {label("trainingTypes", session.trainingType)}
                {session.surface ? ` · ${label("surfaces", session.surface)}` : ""}
                {showPlan && session.planName ? ` · ${session.planName}` : ""}
              </p>
            </DataCell>
            <DataCell>
              {session.intensityLevel ? (
                <IntensityText code={session.intensityLevel}>{label("intensityLevels", session.intensityLevel)}</IntensityText>
              ) : (
                <span className="text-[#b8ad98]">—</span>
              )}
            </DataCell>
            <DataCell className="whitespace-nowrap tabular-nums">
              {formatKm(session.distanceKm)}
              <span className="block text-xs text-[#6b6055]">{formatMinutes(session.durationMinutes)}</span>
            </DataCell>
            <DataCell className="whitespace-nowrap tabular-nums">
              {session.status === "Completed" ? (
                <>
                  {formatKm(session.actualDistanceKm)}
                  <span className="block text-xs text-[#6b6055]">{formatMinutes(session.actualDurationMinutes)}</span>
                </>
              ) : (
                <span className="text-[#6b6055]">—</span>
              )}
            </DataCell>
            <DataCell className="font-semibold tabular-nums">
              {session.performanceScore != null ? formatNumber(session.performanceScore) : <span className="font-normal text-[#6b6055]">—</span>}
            </DataCell>
            <DataCell className="whitespace-nowrap">
              <span className="truncate">{session.assignedToName ?? <span className="text-[#6b6055]">Chưa phân công</span>}</span>
            </DataCell>
            <DataCell>
              <StatusText code={session.status} kind="session">{label("sessionStatuses", session.status)}</StatusText>
            </DataCell>
          </DataRow>
        );
      })}
    </DataTable>
  );
}
