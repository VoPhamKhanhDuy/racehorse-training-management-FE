import ReportBarRow from "./ReportBarRow";
import ReportPanel from "./ReportPanel";

// Nửa "Hiệu suất tập luyện": số liệu tổng quan + bảng xếp hạng số buổi tập theo ngựa (top tập nhiều nhất).
// Không trục số/lưới: mỗi dòng là tên ngựa + thanh ngang + số buổi ở cuối, độ dài thanh so với ngựa tập nhiều nhất.
export default function TrainingPerformanceReport({ report }) {
  const metrics = [
    { label: "Tổng buổi tập", value: report.totalSessions, hint: "đã ghi nhận" },
    { label: "Ngựa đã thi đấu", value: `${report.racedHorseCount}/${report.totalHorses}`, hint: "ở các giải đã diễn ra" },
    {
      label: "Hoàn thành lịch",
      value: `${Math.round(report.completionRate * 100)}%`,
      hint: `${report.completedSchedules}/${report.pastSchedules} lịch đã qua`,
    },
  ];
  const maxSessions = Math.max(1, ...report.sessionsByHorse.map((h) => h.sessions));

  return (
    <ReportPanel
      title="Hiệu suất tập luyện"
      description="Buổi tập, thi đấu và mức độ bám lịch của đàn ngựa."
      metrics={metrics}
    >
      <h3 className="text-sm font-medium text-stone">Số buổi tập theo ngựa</h3>
      <ol className="mt-1">
        {report.sessionsByHorse.map((horse) => (
          <ReportBarRow
            key={horse.name}
            label={horse.name}
            ratio={horse.sessions / maxSessions}
            color="var(--color-brass)"
            value={`${horse.sessions} buổi`}
          />
        ))}
      </ol>
    </ReportPanel>
  );
}
