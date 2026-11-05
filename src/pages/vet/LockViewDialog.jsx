import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDate } from "../../utils/date";
import { getLockDays } from "../../utils/trainingLock";

const LABEL = "text-xs text-[#6b6055]";

function Field({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 text-sm text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Chi tiết 1 lệnh khóa ĐÃ GỠ (chỉ đọc, modal ≤ 480px): cùng bố cục modal gỡ khóa + Ngày gỡ, Người gỡ, Ghi chú khi gỡ.
// releaseInfo: { note, byName } lấy từ services/lockReleaseNoteMock.js (BE chưa lưu) — không có thì hiện "—". Chân: "Đóng".
export default function LockViewDialog({ lock, horse, vetName, relatedExam, releaseInfo, onClose }) {
  const name = horse?.Ten ?? `Ngựa #${lock.HorseID}`;

  const header = <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Lệnh khóa huấn luyện</h2>;
  const footer = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:border-stone/50"
      >
        Đóng
      </button>
    </div>
  );

  return (
    <CenterDialog label={`Lệnh khóa huấn luyện của ${name}`} header={header} footer={footer} onClose={onClose} maxWidth={480}>
      <div className="flex items-center gap-3">
        <HorseAvatar horse={horse} size={40} square />
        <p className="min-w-0 truncate text-base font-semibold text-[#1f1f1f]">{name}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Lý do khóa" wide>
          {lock.LyDo || "—"}
        </Field>
        <Field label="Ngày đặt">{formatDate(lock.NgayDat)}</Field>
        <Field label="Bác sĩ đặt">{vetName ?? "Không rõ"}</Field>
        <Field label="Ngày gỡ">{lock.NgayGo ? formatDate(lock.NgayGo) : "—"}</Field>
        <Field label="Đã khóa">{getLockDays(lock)} ngày</Field>
        <Field label="Người gỡ" wide>
          {releaseInfo?.byName ?? "—"}
        </Field>
        <Field label="Ghi chú khi gỡ" wide>
          <span className="whitespace-pre-line">{releaseInfo?.note || "—"}</span>
        </Field>
        {relatedExam && (
          <Field label="Lần khám liên quan" wide>
            {formatDate(relatedExam.Ngay)} · {relatedExam.ChanDoan}
            <Link to={`/vet/exams?horse=${lock.HorseID}`} className="ml-2 font-semibold text-[#c2570c] hover:underline">
              Xem lần khám
            </Link>
          </Field>
        )}
      </dl>
    </CenterDialog>
  );
}
