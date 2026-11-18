import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ApiErrorNotice from "../../components/ApiErrorNotice";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import TextAreaField from "../../components/TextAreaField";
import TrainingBadge from "../../components/TrainingBadge";
import { RESULT_RULES } from "../../data/trainingCodes";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { completeTrainingSession, getTrainingSession } from "../../services/trainingApi";
import { formatDate, weekdayName } from "../../utils/date";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const emptyForm = {
  actualDistanceKm: "",
  actualDurationMinutes: "",
  performanceScore: "",
  avgHeartRate: "",
  maxHeartRate: "",
  avgSpeedKmh: "",
  result: "",
  trainerComment: "",
  trialVideoUrl: "",
};

const toNumberOrNull = (value) => (value === "" ? null : Number(value));
const inRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Ghi kết quả buổi tập đang tập (POST /api/trainer/training-sessions/{id}/complete): chỉ số thực tế, điểm phong độ 0–10,
// nhận xét chuyên môn (bắt buộc), link video chạy thử. Buổi hoàn thành được tính vào tải tập 7 ngày khi đánh giá thể trạng.
export default function SessionResultForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { label } = useTrainingOptions();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    getTrainingSession(id)
      .then((data) => {
        if (ignore) return;
        setSession(data);
        // Điền sẵn cự ly / thời lượng theo kế hoạch — HLV sửa lại theo thực tế
        setForm({
          ...emptyForm,
          actualDistanceKm: data.distanceKm != null ? String(data.distanceKm) : "",
          actualDurationMinutes: data.durationMinutes != null ? String(data.durationMinutes) : "",
        });
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const backTo = location.state?.from ?? (session ? `/trainer/plans/${session.planId}` : "/trainer/sessions");

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    const distance = Number(form.actualDistanceKm);
    if (form.actualDistanceKm === "" || !(distance > 0) || distance > RESULT_RULES.actualDistanceKmMax) {
      newErrors.actualDistanceKm = `Lớn hơn 0, tối đa ${RESULT_RULES.actualDistanceKmMax} km`;
    }
    const { min: minMinutes, max: maxMinutes } = RESULT_RULES.actualDurationMinutes;
    const minutes = Number(form.actualDurationMinutes);
    if (form.actualDurationMinutes === "" || !Number.isInteger(minutes) || !inRange(minutes, minMinutes, maxMinutes)) {
      newErrors.actualDurationMinutes = `Số nguyên từ ${minMinutes} đến ${maxMinutes} phút`;
    }
    const { min: minScore, max: maxScore } = RESULT_RULES.performanceScore;
    if (form.performanceScore === "" || !inRange(Number(form.performanceScore), minScore, maxScore)) {
      newErrors.performanceScore = `Từ ${minScore} đến ${maxScore}`;
    }
    const { min: minHr, max: maxHr } = RESULT_RULES.heartRate;
    if (form.avgHeartRate !== "" && !inRange(Number(form.avgHeartRate), minHr, maxHr)) {
      newErrors.avgHeartRate = `Từ ${minHr} đến ${maxHr} bpm`;
    }
    if (form.maxHeartRate !== "") {
      if (!inRange(Number(form.maxHeartRate), minHr, maxHr)) newErrors.maxHeartRate = `Từ ${minHr} đến ${maxHr} bpm`;
      else if (form.avgHeartRate !== "" && Number(form.maxHeartRate) < Number(form.avgHeartRate)) {
        newErrors.maxHeartRate = "Không nhỏ hơn nhịp tim trung bình";
      }
    }
    if (form.avgSpeedKmh !== "" && !(Number(form.avgSpeedKmh) > 0 && Number(form.avgSpeedKmh) <= RESULT_RULES.avgSpeedKmhMax)) {
      newErrors.avgSpeedKmh = `Lớn hơn 0, tối đa ${RESULT_RULES.avgSpeedKmhMax} km/h`;
    }
    if (form.result.trim().length > RESULT_RULES.resultMax) newErrors.result = `Tối đa ${RESULT_RULES.resultMax} ký tự`;
    const comment = form.trainerComment.trim();
    if (!comment) newErrors.trainerComment = "Vui lòng nhập nhận xét chuyên môn";
    else if (comment.length > RESULT_RULES.trainerCommentMax) newErrors.trainerComment = `Tối đa ${RESULT_RULES.trainerCommentMax} ký tự`;
    const url = form.trialVideoUrl.trim();
    if (url && (!isHttpUrl(url) || url.length > RESULT_RULES.trialVideoUrlMax)) {
      newErrors.trialVideoUrl = `Đường dẫn http/https, tối đa ${RESULT_RULES.trialVideoUrlMax} ký tự`;
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const saved = await completeTrainingSession(id, {
        actualDistanceKm: Number(form.actualDistanceKm),
        actualDurationMinutes: Number(form.actualDurationMinutes),
        performanceScore: Number(form.performanceScore),
        avgHeartRate: toNumberOrNull(form.avgHeartRate),
        maxHeartRate: toNumberOrNull(form.maxHeartRate),
        avgSpeedKmh: toNumberOrNull(form.avgSpeedKmh),
        result: form.result.trim() || null,
        trainerComment: form.trainerComment.trim(),
        trialVideoUrl: form.trialVideoUrl.trim() || null,
      });
      navigate(backTo, {
        state: { message: `Đã ghi kết quả buổi "${saved.sessionTitle}" của ${saved.horseName} (điểm phong độ ${saved.performanceScore}).` },
      });
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  };

  // Thử lại sau lỗi tải: hiện màn chờ ngay rồi gọi lại (effect phía trên chạy lại theo reloadKey)
  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ApiErrorNotice variant="page" error={loadError} onRetry={retryLoad} />;

  if (session.status !== "InProgress") {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Chưa thể ghi kết quả</h1>
        <p className="mt-2 text-stone">
          Buổi "{session.sessionTitle}" đang ở trạng thái {label("sessionStatuses", session.status)} — chỉ ghi kết quả sau khi đã bắt
          đầu buổi tập và trước khi kết thúc.
        </p>
        <Link to={backTo} className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={backTo} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Ghi kết quả buổi tập</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-stone/15 bg-white px-5 py-4 text-sm">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-semibold text-ink">{session.sessionTitle}</p>
          <p className="text-stone">
            {session.horseName} · {weekdayName(session.trainingDate)} {formatDate(session.trainingDate)} · bắt đầu {session.startTime}
          </p>
        </div>
        <TrainingBadge kind="intensity" code={session.intensityLevel}>
          {label("trainingTypes", session.trainingType)}
        </TrainingBadge>
        <span className="text-ink">
          Kế hoạch: {formatKm(session.distanceKm)} · {formatMinutes(session.durationMinutes)}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            variant="outline"
            label="Cự ly thực tế *"
            id="actualDistanceKm"
            type="number"
            inputMode="decimal"
            min="0.1"
            max={RESULT_RULES.actualDistanceKmMax}
            step="0.1"
            suffix="km"
            value={form.actualDistanceKm}
            onChange={(e) => setField("actualDistanceKm", e.target.value)}
            error={errors.actualDistanceKm}
          />
          <FormField
            variant="outline"
            label="Thời lượng thực tế *"
            id="actualDurationMinutes"
            type="number"
            inputMode="numeric"
            min={RESULT_RULES.actualDurationMinutes.min}
            max={RESULT_RULES.actualDurationMinutes.max}
            step="1"
            suffix="phút"
            value={form.actualDurationMinutes}
            onChange={(e) => setField("actualDurationMinutes", e.target.value)}
            error={errors.actualDurationMinutes}
          />
          <FormField
            variant="outline"
            label="Điểm phong độ *"
            id="performanceScore"
            type="number"
            inputMode="decimal"
            min={RESULT_RULES.performanceScore.min}
            max={RESULT_RULES.performanceScore.max}
            step="0.5"
            suffix="/ 10"
            value={form.performanceScore}
            onChange={(e) => setField("performanceScore", e.target.value)}
            error={errors.performanceScore}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            variant="outline"
            label="Nhịp tim trung bình"
            id="avgHeartRate"
            type="number"
            inputMode="numeric"
            min={RESULT_RULES.heartRate.min}
            max={RESULT_RULES.heartRate.max}
            suffix="bpm"
            value={form.avgHeartRate}
            onChange={(e) => setField("avgHeartRate", e.target.value)}
            error={errors.avgHeartRate}
          />
          <FormField
            variant="outline"
            label="Nhịp tim tối đa"
            id="maxHeartRate"
            type="number"
            inputMode="numeric"
            min={RESULT_RULES.heartRate.min}
            max={RESULT_RULES.heartRate.max}
            suffix="bpm"
            value={form.maxHeartRate}
            onChange={(e) => setField("maxHeartRate", e.target.value)}
            error={errors.maxHeartRate}
          />
          <FormField
            variant="outline"
            label="Vận tốc trung bình"
            id="avgSpeedKmh"
            type="number"
            inputMode="decimal"
            min="0.1"
            max={RESULT_RULES.avgSpeedKmhMax}
            step="0.1"
            suffix="km/h"
            value={form.avgSpeedKmh}
            onChange={(e) => setField("avgSpeedKmh", e.target.value)}
            error={errors.avgSpeedKmh}
          />
        </div>

        <FormField
          variant="outline"
          label="Kết quả ngắn"
          id="result"
          value={form.result}
          maxLength={RESULT_RULES.resultMax}
          placeholder="VD: Hoàn thành tốt"
          onChange={(e) => setField("result", e.target.value)}
          error={errors.result}
        />
        <TextAreaField
          label="Nhận xét chuyên môn *"
          id="trainerComment"
          rows={4}
          value={form.trainerComment}
          maxLength={RESULT_RULES.trainerCommentMax}
          placeholder="VD: Ngựa giữ nhịp tốt, hồi sức nhanh."
          onChange={(e) => setField("trainerComment", e.target.value)}
          error={errors.trainerComment}
        />
        <FormField
          variant="outline"
          label="Link video chạy thử"
          id="trialVideoUrl"
          type="url"
          value={form.trialVideoUrl}
          maxLength={RESULT_RULES.trialVideoUrlMax}
          placeholder="https://..."
          onChange={(e) => setField("trialVideoUrl", e.target.value)}
          error={errors.trialVideoUrl}
        />

        <div className="space-y-4 border-t border-stone/20 pt-5">
          <ApiErrorNotice error={submitError} />
          <div className="flex items-center justify-end gap-5">
            <Link to={backTo} className="text-sm font-medium text-stone underline-offset-2 hover:text-ink hover:underline">
              Hủy
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang lưu..." : "Hoàn thành buổi tập"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
