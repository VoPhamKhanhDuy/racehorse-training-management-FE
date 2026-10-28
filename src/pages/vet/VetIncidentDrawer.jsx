import { useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import { getIncidentStatusColor, getIncidentTypeColor } from "../manager/IncidentTableRow";
import { INCIDENT_DESCRIPTION_MAX, INCIDENT_STATUS } from "../../data/incidentOptions";
import { formatDate, formatDayMonth } from "../../utils/date";

const BLOCK = "border-b border-[#d9cfba] py-4 last:border-b-0";
const LABEL = "text-xs text-[#6b6055]";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Mỗi trạng thái hiện đúng 1 nút: Mới → "Nhận xử lý"; Đang xử lý → "Đánh dấu đã xử lý"; Đã xử lý → không còn nút
const NEXT_ACTION = {
  [INCIDENT_STATUS.NEW]: { status: INCIDENT_STATUS.IN_PROGRESS, label: "Nhận xử lý" },
  [INCIDENT_STATUS.IN_PROGRESS]: { status: INCIDENT_STATUS.DONE, label: "Đánh dấu đã xử lý" },
};

// "YYYY-MM-DDTHH:mm" → "dd/mm/yyyy HH:mm"
const formatHandledAt = (isoDateTime) =>
  isoDateTime ? `${formatDate(isoDateTime.slice(0, 10))} ${isoDateTime.slice(11, 16)}` : "—";

// Ngăn chi tiết sự cố sức khỏe ngựa cho Bác sĩ thú y: xem báo cáo + ghi chú xử lý + đổi trạng thái (qua hộp xác nhận).
// onUpdate(report, { TrangThai, GhiChuXuLy }) trả Promise; lỗi thì ném ra để hiện trong ngăn.
export default function VetIncidentDrawer({ report, horse, stable, lockedSince, onClose, onUpdate }) {
  const [note, setNote] = useState(report?.GhiChuXuLy ?? "");
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!report) return null;

  const action = NEXT_ACTION[report.TrangThai];
  const isDone = report.TrangThai === INCIDENT_STATUS.DONE;
  const noteTooLong = note.trim().length > INCIDENT_DESCRIPTION_MAX;
  // Đóng sự cố (Đã xử lý) bắt buộc có ghi chú; Nhận xử lý thì không
  const needsNote = action?.status === INCIDENT_STATUS.DONE && note.trim() === "";

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

  return (
    <>
      <Drawer
        open
        label={`Sự cố ${report.HorseName} ngày ${formatDate(report.Ngay)}`}
        onClose={onClose}
        header={
          <div className="flex items-center gap-3">
            <HorseAvatar horse={horse} size={40} square />
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight font-semibold text-[#2b2118]">{report.HorseName}</p>
              <p className="text-sm">
                <span className={`font-semibold ${getIncidentTypeColor(report.LoaiSuCo)}`}>{report.LoaiSuCo}</span>
                <span className="text-[#6b6055]"> · </span>
                <span className={`font-semibold ${getIncidentStatusColor(report.TrangThai)}`}>{report.TrangThai}</span>
              </p>
            </div>
          </div>
        }
        footer={
          action ? (
            <>
              {needsNote && <span className="mr-auto self-center text-[13px] text-[#6b6055]">Cần ghi chú trước khi đóng sự cố</span>}
            <button
              type="button"
              disabled={saving || noteTooLong || needsNote}
              onClick={() => setPendingAction(action)}
              className={`h-10 cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a8480a] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
            >
              {action.label}
            </button>
            </>
          ) : null
        }
      >
        <section className={BLOCK}>
          <h3 className={LABEL}>Người báo</h3>
          <p className="mt-1 text-[#2b2118]">{report.ReporterName}</p>
          {stable && <p className="text-[13px] text-[#6b6055]">Chuồng {stable}</p>}
        </section>

        <section className={BLOCK}>
          <h3 className={LABEL}>Ngày báo</h3>
          <p className="mt-1 text-[#2b2118] tabular-nums">{formatDate(report.Ngay)}</p>
        </section>

        <section className={BLOCK}>
          <h3 className={LABEL}>Mô tả</h3>
          {report.MoTa ? (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">{report.MoTa}</p>
          ) : (
            <p className="mt-1 text-sm text-[#6b6055]">Không có mô tả</p>
          )}
        </section>

        {report.HinhAnh && (
          <section className={BLOCK}>
            <h3 className={LABEL}>Hình ảnh</h3>
            <img
              src={report.HinhAnh}
              alt={`Ảnh sự cố ${report.LoaiSuCo} – ${report.HorseName}`}
              className="mt-2 w-full rounded-[4px] border border-[#d9cfba]"
            />
          </section>
        )}

        <section className={BLOCK}>
          <h3 className={LABEL}>Xử lý</h3>
          {isDone ? (
            <>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">{report.GhiChuXuLy || "Không có ghi chú xử lý"}</p>
              <p className="mt-2 text-xs text-[#6b6055]">
                {report.HandlerName ?? "—"} · {formatHandledAt(report.HandledAt)}
              </p>
            </>
          ) : (
            <>
              {lockedSince && (
                <p className="mt-2 text-sm font-semibold text-[#c0262d]">Ngựa đang bị khóa tập từ {formatDayMonth(lockedSince)}</p>
              )}
              <label htmlFor="vetIncidentNote" className="sr-only">
                Ghi chú xử lý
              </label>
              <textarea
                id="vetIncidentNote"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú xử lý"
                className="mt-2 w-full resize-none rounded-[4px] border border-[#cfc4ad] bg-white px-3 py-2 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
              <p className={`mt-1 text-right text-[13px] tabular-nums ${noteTooLong ? "text-[#c0262d]" : "text-[#6b6055]"}`}>
                {note.trim().length}/{INCIDENT_DESCRIPTION_MAX}
              </p>
              {report.HandlerName && (
                <p className="mt-1 text-xs text-[#6b6055]">
                  Nhận xử lý bởi {report.HandlerName} · {formatHandledAt(report.HandledAt)}
                </p>
              )}
            </>
          )}
          {error && <p className="mt-2 text-sm text-[#c0262d]">{error}</p>}
          {!lockedSince && (
            <Link to={`/vet/locks/new?horse=${report.HorseID}`} className={`mt-3 inline-block text-sm font-semibold text-[#c2570c] hover:underline ${FOCUS_RING}`}>
              Khóa huấn luyện ngựa này →
            </Link>
          )}
        </section>
      </Drawer>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.label ?? ""}
        message={
          pendingAction?.status === INCIDENT_STATUS.DONE
            ? `Đánh dấu sự cố của ${report.HorseName} là đã xử lý? Sau đó không thể đổi lại.`
            : `Nhận xử lý sự cố của ${report.HorseName}?`
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
