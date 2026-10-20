import { RefreshCw, TriangleAlert } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import TrainingBadge from "../../components/TrainingBadge";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDateTime, formatKm, formatNumber } from "../../utils/trainingFormat";

const ROW = "flex items-baseline justify-between gap-4 py-1.5 text-sm";
const ROW_LABEL = "shrink-0 text-stone";

// Thể trạng hiện tại của ngựa (GET /api/trainer/horses/{id}/fitness-assessment): mức sẵn sàng, mức cường độ tối đa,
// sinh hiệu lúc nghỉ, tải tập 7 ngày, bài tập được phép và lý do bị giới hạn.
// Trang cha tự gọi API (form cần maxAllowedIntensity để chặn cường độ vượt mức) rồi truyền vào.
export default function HorseFitnessPanel({ fitness, loading, error, onRefresh, emptyText = "Chọn ngựa để xem thể trạng." }) {
  const { label } = useTrainingOptions();

  if (loading) {
    return <p className="py-6 text-center text-sm text-stone">Đang đánh giá thể trạng...</p>;
  }
  if (error) {
    return (
      <div className="space-y-3">
        <ApiErrorNotice error={error} />
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="cursor-pointer text-sm font-medium text-brass-deep hover:underline">
            Thử lại
          </button>
        )}
      </div>
    );
  }
  if (!fitness) {
    return <p className="py-6 text-center text-sm text-stone">{emptyText}</p>;
  }

  const vitals = fitness.latestVitals;
  const load = fitness.recentLoad ?? {};

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone">Thể trạng hiện tại</p>
          <p className="truncate font-serif text-lg font-semibold text-ink">{fitness.horseName}</p>
        </div>
        <TrainingBadge kind="readiness" code={fitness.readiness}>
          {fitness.readinessLabel}
        </TrainingBadge>
      </div>

      <div className="mt-3 divide-y divide-stone/10 border-y border-stone/10">
        <div className={ROW}>
          <span className={ROW_LABEL}>Cường độ tối đa</span>
          <span className="text-right font-medium text-ink">
            {fitness.canTrain && fitness.maxAllowedIntensity ? label("intensityLevels", fitness.maxAllowedIntensity) : "Không được tập"}
          </span>
        </div>
        <div className={ROW}>
          <span className={ROW_LABEL}>Khuyến nghị</span>
          <span className="text-right text-ink">
            {fitness.recommendedIntensity ? label("intensityLevels", fitness.recommendedIntensity) : "—"}
          </span>
        </div>
        <div className={ROW}>
          <span className={ROW_LABEL}>Sức khỏe (thú y)</span>
          <span className="text-right text-ink">{fitness.healthStatus ?? "Chưa cập nhật"}</span>
        </div>
        <div className={ROW}>
          <span className={ROW_LABEL}>Khóa huấn luyện</span>
          <span className={`text-right ${fitness.isTrainingLocked ? "font-medium text-[#946330]" : "text-ink"}`}>
            {fitness.isTrainingLocked ? fitness.lockReason || "Đang khóa" : "Không"}
          </span>
        </div>
        <div className={ROW}>
          <span className={ROW_LABEL}>Tuổi · cân nặng</span>
          <span className="text-right text-ink">
            {fitness.ageYears != null ? `${fitness.ageYears} tuổi` : "—"} · {fitness.weightKg != null ? `${formatNumber(fitness.weightKg)} kg` : "—"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-stone">Sinh hiệu lúc nghỉ (3 ngày gần nhất)</p>
      {vitals ? (
        <p className="mt-1 text-sm text-ink">
          Nhịp tim {formatNumber(vitals.heartRate)} bpm · Nhịp thở {formatNumber(vitals.respiratoryRate)} lần/phút · Thân nhiệt{" "}
          {formatNumber(vitals.bodyTemperature)} °C
          <span className="block text-xs text-stone">Ghi lúc {formatDateTime(vitals.recordedAt)}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone">Chưa có bản ghi.</p>
      )}

      <p className="mt-4 text-xs font-medium text-stone">Tải tập 7 ngày qua</p>
      <p className="mt-1 text-sm text-ink">
        {load.completedSessions ?? 0} buổi hoàn thành · {load.highIntensitySessions ?? 0} buổi cường độ cao · {formatKm(load.distanceKm ?? 0)}
      </p>

      {fitness.allowedTrainingTypes?.length > 0 && (
        <>
          <p className="mt-4 text-xs font-medium text-stone">Bài tập được phép</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {fitness.allowedTrainingTypes.map((code) => (
              <span key={code} className="rounded-full border border-stone/20 px-2.5 py-0.5 text-xs text-ink">
                {label("trainingTypes", code)}
              </span>
            ))}
          </div>
        </>
      )}

      {fitness.warnings?.length > 0 && (
        <ul className="mt-4 space-y-1.5 rounded-sm border-l-2 border-[#946330] bg-[#946330]/5 px-3 py-2.5 text-sm text-[#7a5228]">
          {fitness.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone">
        <span>Đánh giá lúc {formatDateTime(fitness.assessedAt)}</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex cursor-pointer items-center gap-1 font-medium text-brass-deep hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Đánh giá lại
          </button>
        )}
      </div>
    </div>
  );
}
