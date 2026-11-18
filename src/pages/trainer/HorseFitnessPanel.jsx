import { RefreshCw, TriangleAlert } from "lucide-react";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import ReadinessText from "../../components/ReadinessText";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDateTime, formatKm, formatNumber } from "../../utils/trainingFormat";

const ROW = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5";
const ROW_LABEL = "shrink-0 text-[13px] text-[#6b6055]";
const ROW_VALUE = "min-w-0 text-right text-sm font-medium text-[#2b2118]";

// table: bảng 2 cột nhãn–giá trị (nhãn nền #f6f0e3 rộng 220px, kẻ #d9cfba) — dùng ở trang chi tiết giáo án
function Row({ label, children, stacked = false, table = false }) {
  if (table) {
    return (
      <div className="grid grid-cols-[minmax(120px,220px)_minmax(0,1fr)]">
        <dt className="border-r border-[#d9cfba] bg-[#f6f0e3] px-4 py-2.5 text-[13px] font-semibold text-[#6b6055]">{label}</dt>
        <dd className="min-w-0 px-4 py-2.5 text-sm text-[#2b2118]">{children}</dd>
      </div>
    );
  }
  return (
    <div className={stacked ? "py-2.5" : ROW}>
      <dt className={ROW_LABEL}>{label}</dt>
      <dd className={stacked ? "mt-0.5 text-sm font-medium text-[#2b2118]" : ROW_VALUE}>{children}</dd>
    </div>
  );
}

// Thể trạng hiện tại của ngựa (GET /api/trainer/horses/{id}/fitness-assessment): mức sẵn sàng, mức cường độ tối đa,
// sinh hiệu lúc nghỉ, tải tập 7 ngày, bài tập được phép và lý do bị giới hạn.
// Trang cha tự gọi API (form cần maxAllowedIntensity để chặn cường độ vượt mức) rồi truyền vào.
// layout="table": cả panel là 1 khung (viền #b9ab90) gồm bảng nhãn–giá trị, cảnh báo và chân "Đánh giá lúc … / Đánh giá lại".
// showHeader=false: bỏ khối tiêu đề (trang cha đã có tiêu đề + kết luận) — tên ngựa chuyển thành dòng đầu của danh sách.
export default function HorseFitnessPanel({
  fitness,
  loading,
  error,
  onRefresh,
  emptyText = "Chọn ngựa để xem thể trạng.",
  showHeader = true,
  layout = "list",
}) {
  const { label } = useTrainingOptions();

  if (loading) {
    return <p className="py-6 text-center text-sm text-[#6b6055]">Đang đánh giá thể trạng...</p>;
  }
  if (error) {
    return (
      <div className="space-y-3">
        <ApiErrorNotice error={error} />
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="cursor-pointer text-sm font-medium text-[#c2570c] hover:underline">
            Thử lại
          </button>
        )}
      </div>
    );
  }
  if (!fitness) {
    return <p className="py-6 text-center text-sm text-[#6b6055]">{emptyText}</p>;
  }

  const isTable = layout === "table";
  const vitals = fitness.latestVitals;
  const load = fitness.recentLoad ?? {};

  return (
    <div className={isTable ? "overflow-hidden rounded border border-[#b9ab90] bg-white" : ""}>
      {showHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#6b6055]">Thể trạng hiện tại</p>
            <p className="font-serif text-lg font-semibold break-words text-[#2b2118]">{fitness.horseName}</p>
          </div>
          <ReadinessText code={fitness.readiness}>{fitness.readinessLabel}</ReadinessText>
        </div>
      )}

      <dl
        className={
          isTable
            ? "divide-y divide-[#d9cfba]"
            : `divide-y divide-[#ece5d6] border-y border-[#ece5d6] ${showHeader ? "mt-3" : ""}`
        }
      >
        {!showHeader && <Row table={isTable} label="Ngựa">{fitness.horseName}</Row>}
        <Row table={isTable} label="Cường độ tối đa">
          {fitness.canTrain && fitness.maxAllowedIntensity ? label("intensityLevels", fitness.maxAllowedIntensity) : "Không được tập"}
        </Row>
        <Row table={isTable} label="Khuyến nghị">{fitness.recommendedIntensity ? label("intensityLevels", fitness.recommendedIntensity) : "—"}</Row>
        <Row table={isTable} label="Sức khỏe (thú y)">{fitness.healthStatus ?? "Chưa cập nhật"}</Row>
        <Row table={isTable} label="Khóa huấn luyện">
          <span className={fitness.isTrainingLocked ? "text-[#946330]" : ""}>
            {fitness.isTrainingLocked ? fitness.lockReason || "Đang khóa" : "Không"}
          </span>
        </Row>
        <Row table={isTable} label="Tuổi · cân nặng">
          {fitness.ageYears != null ? `${fitness.ageYears} tuổi` : "—"} · {fitness.weightKg != null ? `${formatNumber(fitness.weightKg)} kg` : "—"}
        </Row>
        <Row table={isTable} label="Sinh hiệu lúc nghỉ (3 ngày gần nhất)" stacked>
          {vitals ? (
            <>
              Nhịp tim {formatNumber(vitals.heartRate)} bpm · Nhịp thở {formatNumber(vitals.respiratoryRate)} lần/phút · Thân nhiệt{" "}
              {formatNumber(vitals.bodyTemperature)} °C
              <span className="block text-xs font-normal text-[#6b6055]">Ghi lúc {formatDateTime(vitals.recordedAt)}</span>
            </>
          ) : (
            <span className="font-normal text-[#6b6055]">Chưa có bản ghi.</span>
          )}
        </Row>
        <Row table={isTable} label="Tải tập 7 ngày qua" stacked>
          {load.completedSessions ?? 0} buổi hoàn thành · {load.highIntensitySessions ?? 0} buổi cường độ cao · {formatKm(load.distanceKm ?? 0)}
        </Row>
        {fitness.allowedTrainingTypes?.length > 0 && (
          <Row table={isTable} label="Bài tập được phép" stacked>
            {fitness.allowedTrainingTypes.map((code) => label("trainingTypes", code)).join(" · ")}
          </Row>
        )}
      </dl>

      {fitness.warnings?.length > 0 && (
        <ul
          className={`space-y-1.5 border-l-2 border-[#946330] text-sm text-[#7a5228] ${
            isTable ? "m-3 pl-3" : "mt-4 pl-3"
          }`}
        >
          {fitness.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <div
        className={`flex items-center justify-between gap-3 text-xs text-[#6b6055] ${
          isTable ? "border-t border-[#d9cfba] bg-white px-4 py-2.5" : "mt-4"
        }`}
      >
        <span>Đánh giá lúc {formatDateTime(fitness.assessedAt)}</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#c2570c] hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Đánh giá lại
          </button>
        )}
      </div>
    </div>
  );
}
