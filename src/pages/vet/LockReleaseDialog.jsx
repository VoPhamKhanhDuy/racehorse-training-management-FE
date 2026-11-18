import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import HorseAvatar from "../../components/HorseAvatar";
import TextAreaField from "../../components/TextAreaField";
import { RELEASE_HEALTH_STATES } from "../../data/medicalRecordOptions";
import { RELEASE_NOTE_MAX } from "../../services/lockReleaseNoteMock";
import { formatDate } from "../../utils/date";
import { getLockDays } from "../../utils/trainingLock";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// "Gỡ lệnh khóa huấn luyện" — modal giữa màn hình (≤ 480px): ngựa, lý do khóa, đã khóa n ngày; BẮT BUỘC chọn tình trạng sức khỏe mới
// (API release: "Cần theo dõi" | "Đủ điều kiện", không chọn sẵn) và ghi chú khi gỡ (≤ 300 ký tự, bắt buộc).
// onConfirm({ status, note }) trả Promise; lỗi thì ném ra để hiện trong khung.
export default function LockReleaseDialog({ lock, horse, onConfirm, onClose }) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const name = horse?.Ten ?? `Ngựa #${lock.HorseID}`;

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!status) nextErrors.status = "Vui lòng chọn tình trạng sức khỏe mới";
    if (!note.trim()) nextErrors.note = "Vui lòng nhập ghi chú khi gỡ";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      await onConfirm({ status, note });
    } catch (err) {
      setSubmitError(err.message || "Không gỡ được lệnh khóa, vui lòng thử lại.");
      setBusy(false);
    }
  };

  const header = <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Gỡ lệnh khóa huấn luyện</h2>;
  const footer = (
    <div>
      {submitError && <p className="mb-3 text-sm text-[#c0262d]">{submitError}</p>}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
          Hủy
        </button>
        <button type="button" onClick={handleSubmit} disabled={busy} className="btn-primary">
          {busy ? "Đang xử lý..." : "Gỡ khóa"}
        </button>
      </div>
    </div>
  );

  return (
    <CenterDialog label={`Gỡ lệnh khóa của ${name}`} header={header} footer={footer} onClose={onClose} busy={busy} maxWidth={480}>
      <div className="flex items-center gap-3">
        <HorseAvatar horse={horse} size={40} square />
        <p className="min-w-0 truncate text-base font-semibold text-[#1f1f1f]">{name}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="col-span-2 min-w-0">
          <dt className="text-xs text-[#6b6055]">Lý do khóa</dt>
          <dd className="mt-0.5 text-[#2b2118]">{lock.LyDo || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#6b6055]">Ngày đặt</dt>
          <dd className="mt-0.5 text-[#2b2118] tabular-nums">{formatDate(lock.NgayDat)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#6b6055]">Đã khóa</dt>
          <dd className="mt-0.5 text-[#2b2118]">{getLockDays(lock)} ngày</dd>
        </div>
      </dl>

      <div className="mt-5">
        <label htmlFor="releaseStatus" className="mb-1.5 block font-serif text-sm font-semibold text-stone">
          Tình trạng sức khỏe mới
        </label>
        <select
          id="releaseStatus"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setErrors((prev) => ({ ...prev, status: undefined }));
          }}
          aria-invalid={Boolean(errors.status)}
          className={`h-10 w-full cursor-pointer rounded-[4px] border bg-white px-3 text-sm text-[#1f1f1f] outline-none focus:border-[#c2570c] ${errors.status ? "border-[#c0262d]" : "border-[#E3E3E3]"}`}
        >
          <option value="">Chọn tình trạng</option>
          {RELEASE_HEALTH_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.status ? <p className="mt-1 text-sm text-[#c0262d]">{errors.status}</p> : <p className="mt-1 text-xs text-[#6b6055]">Do bác sĩ quyết định. Sau khi gỡ, ngựa có thể được xếp lịch tập trở lại.</p>}
      </div>

      <div className="mt-5">
        <TextAreaField
          label="Ghi chú khi gỡ"
          id="releaseNote"
          rows={3}
          value={note}
          maxLength={RELEASE_NOTE_MAX}
          radiusClass="rounded-[4px]"
          onChange={(e) => {
            setNote(e.target.value);
            setErrors((prev) => ({ ...prev, note: undefined }));
          }}
          error={errors.note}
        />
      </div>
    </CenterDialog>
  );
}
