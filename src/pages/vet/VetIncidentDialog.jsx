import { useState } from "react";
import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import HorseAvatar from "../../components/HorseAvatar";
import { HEALTH_INCIDENT_TYPES, INCIDENT_DESCRIPTION_MAX, INCIDENT_STATUS } from "../../data/incidentOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "text-xs text-[#6b6055]";
const GROUP_TITLE = "font-serif text-base font-semibold text-[#2b2118]";

// Mỗi trạng thái hiện đúng 1 nút chính: Mới → "Tiếp nhận"; Đang xử lý → "Hoàn tất xử lý" (bắt buộc ghi chú); Đã xử lý → không còn nút
const NEXT_ACTION = {
  [INCIDENT_STATUS.NEW]: { status: INCIDENT_STATUS.IN_PROGRESS, label: "Tiếp nhận" },
  [INCIDENT_STATUS.IN_PROGRESS]: { status: INCIDENT_STATUS.DONE, label: "Hoàn tất xử lý" },
};

const capitalizeFirst = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);
// "YYYY-MM-DDTHH:mm" → "dd/MM HH:mm" (không có thì "")
const formatHandledAt = (isoDateTime) => (isoDateTime ? `${formatDayMonth(isoDateTime.slice(0, 10))} ${isoDateTime.slice(11, 16)}` : "");

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 text-sm text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Chi tiết sự cố sức khỏe ngựa cho Bác sĩ thú y — MODAL giữa màn hình (rộng ≤ 620px, đầu + chân cố định, chỉ thân cuộn):
// Thông tin, Tiến trình 3 bước, Xử lý (ghi chú khi Đang xử lý), Việc liên quan (ghi lần khám / đặt lệnh khóa). Đổi trạng thái qua hộp xác nhận.
// onUpdate(report, { TrangThai, GhiChuXuLy }) trả Promise; lỗi thì ném ra để hiện trong khung.
export default function VetIncidentDialog({ report, horse, stable, lockedSince, onClose, onUpdate }) {
  const [note, setNote] = useState(report.GhiChuXuLy ?? "");
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);

  const action = NEXT_ACTION[report.TrangThai];
  const isNew = report.TrangThai === INCIDENT_STATUS.NEW;
  const inProgress = report.TrangThai === INCIDENT_STATUS.IN_PROGRESS;
  const isDone = report.TrangThai === INCIDENT_STATUS.DONE;
  const noteTooLong = note.trim().length > INCIDENT_DESCRIPTION_MAX;
  // Hoàn tất bắt buộc có ghi chú; Tiếp nhận thì không
  const needsNote = action?.status === INCIDENT_STATUS.DONE && note.trim() === "";
  const isHealth = HEALTH_INCIDENT_TYPES.includes(report.LoaiSuCo);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await onUpdate(report, { TrangThai: pendingAction.status, GhiChuXuLy: note });
      setPendingAction(null);
    } catch (err) {
      setPendingAction(null);
      setError(err.message || "Không cập nhật được, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Tiến trình: bước hiện tại chữ weight 600, bước chưa tới chữ xám
  const handledAt = formatHandledAt(report.HandledAt);
  const steps = [
    { key: "reported", current: isNew, reached: true, text: `Đã báo — ${report.ReporterName}, ${formatDayMonth(report.Ngay)}` },
    {
      key: "accepted",
      current: inProgress,
      reached: inProgress || isDone,
      text: inProgress || isDone ? `Tiếp nhận — ${report.HandlerName ?? "—"}${inProgress && handledAt ? `, ${handledAt}` : ""}` : "Chưa tiếp nhận",
    },
    {
      key: "done",
      current: isDone,
      reached: isDone,
      text: isDone ? `Hoàn tất${handledAt ? ` — ${handledAt}` : ""}` : "Chưa hoàn tất",
      note: isDone ? report.GhiChuXuLy || "Không có ghi chú xử lý" : "",
    },
  ];

  const header = (
    <div className="flex items-center gap-3">
      <HorseAvatar horse={horse} size={40} square />
      <div className="min-w-0">
        <h2 className="truncate font-serif text-lg leading-tight font-semibold text-[#2b2118]">{report.HorseName}</h2>
        <p className="text-sm text-[#6b6055]">
          {report.LoaiSuCo} · báo ngày {formatDate(report.Ngay)}
        </p>
      </div>
    </div>
  );

  const footer = (
    <div>
      {error && <p className="mb-3 text-sm text-[#c0262d]">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} disabled={saving} className={OUTLINE_BUTTON}>
          Đóng
        </button>
        {action && (
          <span className="flex items-center gap-3">
            {needsNote && <span className="text-[13px] text-[#6b6055]">Cần ghi chú trước khi hoàn tất</span>}
            <button type="button" disabled={saving || noteTooLong || needsNote} onClick={() => setPendingAction(action)} className="btn-primary">
              {action.label}
            </button>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <CenterDialog
        label={`Sự cố ${report.HorseName} ngày ${formatDate(report.Ngay)}`}
        header={header}
        footer={footer}
        onClose={onClose}
        busy={saving || Boolean(pendingAction) || zoomed}
        maxWidth={620}
      >
        <section>
          <h3 className={GROUP_TITLE}>Thông tin</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Người báo">{report.ReporterName}</Field>
            <Field label="Chuồng">{stable || "—"}</Field>
            <Field label="Loại sự cố">{report.LoaiSuCo}</Field>
            <Field label="Trạng thái">{report.TrangThai}</Field>
            <div className="col-span-2 min-w-0">
              <dt className={LABEL}>Mô tả</dt>
              <dd className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">
                {report.MoTa ? capitalizeFirst(report.MoTa) : <span className="text-[#6b6055]">Không có mô tả</span>}
              </dd>
            </div>
            {report.HinhAnh && (
              <div className="col-span-2 min-w-0">
                <dt className={LABEL}>Hình ảnh</dt>
                <dd className="mt-1">
                  <button type="button" onClick={() => setZoomed(true)} aria-label="Xem ảnh lớn" className="cursor-zoom-in">
                    <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${report.HorseName}`} className="h-24 w-24 rounded-[4px] border border-[#E3E3E3] object-cover" />
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mt-5">
          <h3 className={GROUP_TITLE}>Tiến trình</h3>
          <ul className="mt-3 space-y-2">
            {steps.map((step) => (
              <li key={step.key} className="text-sm">
                <span className={step.current ? "font-semibold text-[#1f1f1f]" : step.reached ? "text-[#2b2118]" : "text-[#6b6b6b]"}>{step.text}</span>
                {step.note && <span className="mt-0.5 block text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">{step.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className={GROUP_TITLE}>Xử lý</h3>
          {isNew && <p className="mt-2 text-sm text-[#6b6055]">Nhấn "Tiếp nhận" để bắt đầu xử lý.</p>}
          {inProgress && (
            <>
              {lockedSince && <p className="mt-2 text-sm font-semibold text-[#1f1f1f]">Ngựa đang bị khóa tập từ {formatDayMonth(lockedSince)}</p>}
              <label htmlFor="vetIncidentNote" className="mt-2 block text-xs text-[#6b6055]">
                Ghi chú xử lý
              </label>
              <textarea
                id="vetIncidentNote"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú xử lý"
                className="mt-1 w-full resize-none rounded-[4px] border border-[#E3E3E3] bg-white px-3 py-2 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
              <p className={`mt-1 text-right text-[13px] tabular-nums ${noteTooLong ? "text-[#c0262d]" : "text-[#6b6055]"}`}>
                {note.trim().length}/{INCIDENT_DESCRIPTION_MAX}
              </p>
            </>
          )}
          {isDone && <p className="mt-2 text-sm text-[#6b6055]">Sự cố đã được xử lý.</p>}
        </section>

        {isHealth && (
          <section className="mt-5">
            <h3 className={GROUP_TITLE}>Việc liên quan</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to={`/vet/exams/new?horse=${report.HorseID}`} className={OUTLINE_BUTTON}>
                Ghi lần khám
              </Link>
              <Link to={`/vet/locks/new?horse=${report.HorseID}`} className={OUTLINE_BUTTON}>
                Đặt lệnh khóa huấn luyện
              </Link>
            </div>
          </section>
        )}
      </CenterDialog>

      {zoomed && report.HinhAnh && (
        <div className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-[#232328]/70 p-4" onClick={() => setZoomed(false)} role="presentation">
          <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${report.HorseName}`} className="max-h-full max-w-full rounded-[4px] bg-white object-contain" />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.label ?? ""}
        message={
          pendingAction?.status === INCIDENT_STATUS.DONE
            ? `Đánh dấu sự cố của ${report.HorseName} là đã xử lý? Sau đó không thể đổi lại.`
            : `Tiếp nhận xử lý sự cố của ${report.HorseName}?`
        }
        confirmLabel="Xác nhận"
        danger={false}
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
