import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import SelectField from "../../components/SelectField";
import TextAreaField from "../../components/TextAreaField";
import useAuth from "../../hooks/useAuth";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { submitSessionReview } from "../../services/sessionReviewMock";
import { formatDate, weekdayName } from "../../utils/date";
import {
  ASSESSMENTS,
  REVIEW_COMMENT_MAX,
  assessmentColor,
  assessmentLabel,
  reactionLabel,
  resultLabel,
  sessionStage,
} from "../../utils/sessionReview";
import { formatDateTime, formatKm, formatMinutes, formatTimeRange } from "../../utils/trainingFormat";

const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

function InfoRow({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 text-sm">
      <dt className="text-[#6b6055]">{label}</dt>
      <dd className="min-w-0 text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Khung chi tiết buổi tập của Trainer (MOCK — services/sessionReviewMock.js), nội dung theo tình trạng buổi (sessionStage):
// 1. Chưa diễn ra → thông tin buổi, chân "Đóng"
// 2. Chờ báo cáo (đã qua giờ, Groom chưa báo cáo) → thông tin + "<Groom> chưa báo cáo buổi tập này.", chân "Đóng"
// 3. Chờ đánh giá (Groom đã báo cáo) → thông tin + báo cáo của Groom + form đánh giá, chân "Hủy" / "Lưu đánh giá"
// 4. Đã đánh giá → báo cáo + đánh giá chỉ đọc, chân "Sửa đánh giá" / "Đóng" (Sửa → quay lại form như tình trạng 3)
export default function SessionReviewDialog({ session, record, onClose, onSaved }) {
  const { user } = useAuth();
  const { label } = useTrainingOptions();
  const stage = sessionStage(session, record);
  const report = record?.report ?? null;
  const review = record?.review ?? null;
  const [editing, setEditing] = useState(stage === "AwaitingReview");
  const [form, setForm] = useState({
    score: review ? String(review.score) : "",
    assessment: review?.assessment ?? "",
    comment: review?.comment ?? "",
    visibleToOwner: review?.visibleToOwner ?? true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.score) nextErrors.score = "Chọn điểm từ 1 đến 10";
    if (!form.assessment) nextErrors.assessment = "Vui lòng chọn nhận định";
    if (!form.comment.trim()) nextErrors.comment = "Vui lòng nhập nhận xét";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await submitSessionReview(session, form, user.fullName);
      onSaved("Đã lưu đánh giá buổi tập");
    } catch (err) {
      setSubmitError(err.message || "Không lưu được đánh giá, vui lòng thử lại.");
      setBusy(false);
    }
  };

  const title = { Upcoming: "Buổi tập chưa diễn ra", AwaitingReport: "Chờ báo cáo" }[stage] ?? "Đánh giá buổi tập";
  const showForm = (stage === "AwaitingReview" || stage === "Reviewed") && editing;

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{title}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {session.horseName} · {weekdayName(session.trainingDate)}, {formatDate(session.trainingDate)}
      </p>
    </div>
  );

  let footer;
  if (showForm) {
    footer = (
      <div>
        {submitError && <p className="mb-3 text-sm text-alert">{submitError}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={stage === "Reviewed" ? () => setEditing(false) : onClose}
            disabled={busy}
            className={OUTLINE_BUTTON}
          >
            Hủy
          </button>
          <button type="submit" form="sessionReviewForm" disabled={busy} className="btn-primary">
            {busy ? "Đang lưu..." : "Lưu đánh giá"}
          </button>
        </div>
      </div>
    );
  } else if (stage === "Reviewed") {
    footer = (
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
          Đóng
        </button>
        <button type="button" onClick={() => setEditing(true)} className="btn-primary">
          Sửa đánh giá
        </button>
      </div>
    );
  } else {
    footer = (
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
          Đóng
        </button>
      </div>
    );
  }

  return (
    <CenterDialog label={title} header={header} footer={footer} onClose={onClose} busy={busy}>
      <section>
        <h3 className={SECTION_TITLE}>{session.sessionTitle}</h3>
        <dl className="mt-3 space-y-2">
          <InfoRow label="Ngày giờ">
            {weekdayName(session.trainingDate)}, {formatDate(session.trainingDate)} · {formatTimeRange(session.startTime, session.endTime)}
          </InfoRow>
          <InfoRow label="Ngựa">{session.horseName}</InfoRow>
          <InfoRow label="Mặt đường">{session.surface ? label("surfaces", session.surface) : "Theo bài tập"}</InfoRow>
          <InfoRow label="Cường độ">{session.intensityLevel ? label("intensityLevels", session.intensityLevel) : "—"}</InfoRow>
          <InfoRow label="Kế hoạch">
            {formatKm(session.distanceKm)} · {formatMinutes(session.durationMinutes)}
          </InfoRow>
          <InfoRow label="Phụ trách">{session.assignedToName ?? "Chưa phân công"}</InfoRow>
        </dl>
      </section>

      {stage === "AwaitingReport" && (
        <p className="mt-6 border-t border-stone/15 pt-6 text-sm text-[#2b2118]">
          <span className="font-semibold">{session.assignedToName ?? "Nhân viên chăm sóc"}</span> chưa báo cáo buổi tập này.
        </p>
      )}

      {report && (
        <section className="mt-6 border-t border-stone/15 pt-6">
          <h3 className={SECTION_TITLE}>Báo cáo của Groom</h3>
          <dl className="mt-3 space-y-2">
            <InfoRow label="Người báo cáo">{report.reportedByName}</InfoRow>
            <InfoRow label="Kết quả">{resultLabel(report.result)}</InfoRow>
            <InfoRow label="Quãng đường thực tế">{report.result === "NotTrained" ? "—" : formatKm(report.actualDistanceKm)}</InfoRow>
            <InfoRow label="Phản ứng của ngựa">
              <span className={report.horseReaction === "Abnormal" ? "font-semibold text-[#c2570c]" : ""}>{reactionLabel(report.horseReaction)}</span>
            </InfoRow>
            {report.note && (
              <InfoRow label="Ghi chú">
                <span className="whitespace-pre-line">{report.note}</span>
              </InfoRow>
            )}
            <InfoRow label="Báo cáo lúc">{formatDateTime(report.reportedAt)}</InfoRow>
          </dl>
        </section>
      )}

      {showForm && (
        <section className="mt-6 border-t border-stone/15 pt-6">
          <h3 className={SECTION_TITLE}>Đánh giá của bạn</h3>
          <form id="sessionReviewForm" onSubmit={handleSubmit} noValidate className="mt-4 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                variant="outline"
                label="Điểm phong độ (1–10)"
                id="reviewScore"
                value={form.score}
                onChange={(e) => setField("score", e.target.value)}
                error={errors.score}
              >
                <option value="">Chọn điểm</option>
                {SCORES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
              <SelectField
                variant="outline"
                label="Nhận định"
                id="reviewAssessment"
                value={form.assessment}
                onChange={(e) => setField("assessment", e.target.value)}
                error={errors.assessment}
              >
                <option value="">Chọn nhận định</option>
                {ASSESSMENTS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextAreaField
              label="Nhận xét"
              id="reviewComment"
              rows={4}
              value={form.comment}
              maxLength={REVIEW_COMMENT_MAX}
              radiusClass="rounded-[4px]"
              placeholder="VD: Ngựa giữ nhịp tốt, tăng dần cự ly ở buổi sau"
              onChange={(e) => setField("comment", e.target.value)}
              error={errors.comment}
            />
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#2b2118]">
              <input
                type="checkbox"
                checked={form.visibleToOwner}
                onChange={(e) => setField("visibleToOwner", e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#c2570c]"
              />
              Hiển thị cho chủ ngựa
            </label>
          </form>
        </section>
      )}

      {stage === "Reviewed" && !editing && review && (
        <section className="mt-6 border-t border-stone/15 pt-6">
          <h3 className={SECTION_TITLE}>Đánh giá của bạn</h3>
          <dl className="mt-3 space-y-2">
            <InfoRow label="Điểm phong độ">
              <span className="font-semibold tabular-nums">{review.score}</span>
            </InfoRow>
            <InfoRow label="Nhận định">
              <span className={`font-semibold ${assessmentColor(review.assessment)}`}>{assessmentLabel(review.assessment)}</span>
            </InfoRow>
            <InfoRow label="Nhận xét">
              <span className="whitespace-pre-line">{review.comment}</span>
            </InfoRow>
            <InfoRow label="Chủ ngựa">{review.visibleToOwner ? "Được hiển thị cho chủ ngựa" : "Không hiển thị cho chủ ngựa"}</InfoRow>
            <InfoRow label="Đánh giá lúc">{formatDateTime(review.reviewedAt)}</InfoRow>
          </dl>
        </section>
      )}
    </CenterDialog>
  );
}
