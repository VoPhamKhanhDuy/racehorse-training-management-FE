import { useState } from "react";
import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import FormField from "../../components/FormField";
import SelectField from "../../components/SelectField";
import TextAreaField from "../../components/TextAreaField";
import useAuth from "../../hooks/useAuth";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { submitSessionReport } from "../../services/sessionReviewMock";
import { formatDate, weekdayName } from "../../utils/date";
import { HORSE_REACTIONS, REPORT_DISTANCE_MAX, REPORT_NOTE_MAX, REPORT_RESULTS, reactionLabel, resultLabel } from "../../utils/sessionReview";
import { formatKm, formatTimeRange } from "../../utils/trainingFormat";

const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
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

// "Báo cáo buổi tập" của nhân viên chăm sóc (MOCK — services/sessionReviewMock.js): thông tin buổi chỉ đọc + kết quả, quãng đường thực tế,
// phản ứng của ngựa, ghi chú. Groom chỉ báo cáo sự thật, KHÔNG đánh giá — đánh giá là việc của Trainer.
// record?.report đã có → chế độ XEM (chỉ đọc, chân chỉ có "Đóng"). Chọn "Có dấu hiệu bất thường" → gợi ý gửi báo cáo sự cố (không chặn lưu).
export default function GroomSessionReportDialog({ session, record, onClose, onSaved }) {
  const { user } = useAuth();
  const { label } = useTrainingOptions({ remote: false });
  const report = record?.report ?? null;
  const [form, setForm] = useState({ result: "", actualDistanceKm: "", horseReaction: "", note: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const notTrained = form.result === "NotTrained";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.result) nextErrors.result = "Vui lòng chọn kết quả";
    if (!form.horseReaction) nextErrors.horseReaction = "Vui lòng chọn phản ứng của ngựa";
    if (!notTrained && form.actualDistanceKm !== "") {
      const km = Number(form.actualDistanceKm);
      if (!Number.isFinite(km) || km < 0 || km > REPORT_DISTANCE_MAX) nextErrors.actualDistanceKm = `Từ 0 đến ${REPORT_DISTANCE_MAX} km`;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await submitSessionReport(session, form, user.fullName);
      onSaved("Đã lưu báo cáo buổi tập");
    } catch (err) {
      setSubmitError(err.message || "Không lưu được báo cáo, vui lòng thử lại.");
      setBusy(false);
    }
  };

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{report ? "Báo cáo buổi tập đã gửi" : "Báo cáo buổi tập"}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {session.horseName} · {weekdayName(session.trainingDate)}, {formatDate(session.trainingDate)}
      </p>
    </div>
  );

  const footer = report ? (
    <div className="flex justify-end">
      <button type="button" onClick={onClose} className="btn-primary">
        Đóng
      </button>
    </div>
  ) : (
    <div>
      {submitError && <p className="mb-3 text-sm text-alert">{submitError}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
          Hủy
        </button>
        <button type="submit" form="sessionReportForm" disabled={busy} className="btn-primary">
          {busy ? "Đang lưu..." : "Lưu báo cáo"}
        </button>
      </div>
    </div>
  );

  const surfaceAndIntensity = [session.surface && label("surfaces", session.surface), session.intensityLevel && label("intensityLevels", session.intensityLevel)]
    .filter(Boolean)
    .join(" · ");

  return (
    <CenterDialog label="Báo cáo buổi tập" header={header} footer={footer} onClose={onClose} busy={busy}>
      <section>
        <h3 className={SECTION_TITLE}>{session.sessionTitle}</h3>
        <dl className="mt-3 space-y-2">
          <InfoRow label="Ngày giờ">
            {weekdayName(session.trainingDate)}, {formatDate(session.trainingDate)} · {formatTimeRange(session.startTime, session.endTime)}
          </InfoRow>
          <InfoRow label="Ngựa">{session.horseName}</InfoRow>
          {surfaceAndIntensity && <InfoRow label="Mặt đường · cường độ">{surfaceAndIntensity}</InfoRow>}
          <InfoRow label="Quãng đường kế hoạch">{formatKm(session.distanceKm)}</InfoRow>
          {session.notes && <InfoRow label="Dặn dò">{session.notes}</InfoRow>}
        </dl>
      </section>

      {report ? (
        <section className="mt-6 border-t border-stone/15 pt-6">
          <h3 className={SECTION_TITLE}>Báo cáo của bạn</h3>
          <dl className="mt-3 space-y-2">
            <InfoRow label="Kết quả">{resultLabel(report.result)}</InfoRow>
            <InfoRow label="Quãng đường thực tế">{report.result === "NotTrained" ? "—" : formatKm(report.actualDistanceKm)}</InfoRow>
            <InfoRow label="Phản ứng của ngựa">{reactionLabel(report.horseReaction)}</InfoRow>
            {report.note && (
              <InfoRow label="Ghi chú">
                <span className="whitespace-pre-line">{report.note}</span>
              </InfoRow>
            )}
          </dl>
        </section>
      ) : (
        <form id="sessionReportForm" onSubmit={handleSubmit} noValidate className="mt-6 space-y-5 border-t border-stone/15 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              variant="outline"
              label="Kết quả"
              id="reportResult"
              value={form.result}
              onChange={(e) => setField("result", e.target.value)}
              error={errors.result}
            >
              <option value="">Chọn kết quả</option>
              {REPORT_RESULTS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </SelectField>
            <FormField
              variant="outline"
              label="Quãng đường thực tế (km)"
              id="reportDistance"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max={REPORT_DISTANCE_MAX}
              value={notTrained ? "" : form.actualDistanceKm}
              disabled={notTrained}
              placeholder="Không bắt buộc"
              onChange={(e) => setField("actualDistanceKm", e.target.value)}
              error={errors.actualDistanceKm}
            />
          </div>
          <SelectField
            variant="outline"
            label="Phản ứng của ngựa"
            id="reportReaction"
            value={form.horseReaction}
            onChange={(e) => setField("horseReaction", e.target.value)}
            error={errors.horseReaction}
          >
            <option value="">Chọn phản ứng</option>
            {HORSE_REACTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </SelectField>
          {form.horseReaction === "Abnormal" && (
            <p className="text-sm text-[#2b2118]">
              Bạn có muốn gửi báo cáo sự cố?{" "}
              <Link to="/groom/incidents/new" className="font-semibold text-[#c2570c] hover:underline">
                Báo cáo sự cố
              </Link>
              <span className="block text-[13px] text-[#6b6055]">Không bắt buộc, bạn vẫn lưu được báo cáo buổi tập này.</span>
            </p>
          )}
          <TextAreaField
            label="Ghi chú"
            id="reportNote"
            rows={3}
            value={form.note}
            maxLength={REPORT_NOTE_MAX}
            radiusClass="rounded-[4px]"
            placeholder="Không bắt buộc"
            onChange={(e) => setField("note", e.target.value)}
          />
        </form>
      )}
    </CenterDialog>
  );
}
