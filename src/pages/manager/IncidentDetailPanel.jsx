import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import Drawer from "../../components/Drawer";
import { getIncidentStatusColor, getIncidentTypeColor } from "./IncidentTableRow";
import { formatDate } from "../../utils/date";
import { HEALTH_INCIDENT_TYPES, INCIDENT_DESCRIPTION_MAX, INCIDENT_STATUS } from "../../data/incidentOptions";

const BLOCK = "border-b border-[#d9cfba] py-4 last:border-b-0";
const LABEL = "text-xs text-[#6b6055]";
const ACTION_BTN =
  "h-10 cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a8480a] disabled:cursor-not-allowed disabled:opacity-60";

// Nút đổi trạng thái hiện theo trạng thái hiện tại: Mới → "Nhận xử lý" + "Đã xử lý"; Đang xử lý → "Đã xử lý"
const ACTIONS = [
  { status: INCIDENT_STATUS.IN_PROGRESS, label: "Nhận xử lý", from: [INCIDENT_STATUS.NEW] },
  { status: INCIDENT_STATUS.DONE, label: "Đã xử lý", from: [INCIDENT_STATUS.NEW, INCIDENT_STATUS.IN_PROGRESS] },
];

// "YYYY-MM-DDTHH:mm" → "dd/mm/yyyy HH:mm"
const formatHandledAt = (isoDateTime) =>
  isoDateTime ? `${formatDate(isoDateTime.slice(0, 10))} ${isoDateTime.slice(11, 16)}` : "—";

// Ngăn chi tiết 1 báo cáo sự cố cho Club Manager. Sự cố sức khỏe ngựa: chỉ đọc (bác sĩ thú y xử lý).
// Sự cố chuồng/thiết bị và "Khác": Manager ghi chú xử lý + đổi trạng thái (qua hộp xác nhận). Không sửa/xóa báo cáo.
// onUpdate(report, { TrangThai, GhiChuXuLy }) trả Promise; lỗi thì ném ra để hiện trong ngăn.
export default function IncidentDetailPanel({ report, onClose, onUpdate }) {
  const [note, setNote] = useState(report?.GhiChuXuLy ?? "");
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!report) return null;

  const isHealth = HEALTH_INCIDENT_TYPES.includes(report.LoaiSuCo);
  const isDone = report.TrangThai === INCIDENT_STATUS.DONE;
  const actions = ACTIONS.filter((a) => a.from.includes(report.TrangThai));
  const noteTooLong = note.trim().length > INCIDENT_DESCRIPTION_MAX;

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
        label={`Báo cáo sự cố ${report.HorseName} ngày ${formatDate(report.Ngay)}`}
        onClose={onClose}
        header={
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight font-semibold text-[#2b2118]">{report.HorseName}</p>
            <p className="text-sm">
              <span className={`font-semibold ${getIncidentTypeColor(report.LoaiSuCo)}`}>{report.LoaiSuCo}</span>
              <span className="text-[#6b6055]"> · </span>
              <span className={`font-semibold ${getIncidentStatusColor(report.TrangThai)}`}>{report.TrangThai}</span>
            </p>
          </div>
        }
        footer={
          !isHealth && actions.length > 0 ? (
            actions.map((a) => (
              <button
                key={a.status}
                type="button"
                disabled={saving || noteTooLong}
                onClick={() => setPendingAction(a)}
                className={ACTION_BTN}
              >
                {a.label}
              </button>
            ))
          ) : null
        }
      >
        <section className={BLOCK}>
          <h3 className={LABEL}>Người báo</h3>
          <p className="mt-1 text-[#2b2118]">{report.ReporterName}</p>
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

        {isHealth ? (
          <section className={BLOCK}>
            <h3 className={LABEL}>Xử lý</h3>
            <p className="mt-1 text-sm text-[#2b2118]">Do bác sĩ thú y xử lý</p>
          </section>
        ) : (
          <section className={BLOCK}>
            <h3 className={LABEL}>Xử lý</h3>
            {isDone ? (
              <>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">
                  {report.GhiChuXuLy || "Không có ghi chú xử lý"}
                </p>
                <p className="mt-2 text-xs text-[#6b6055]">
                  {report.HandlerName ?? "—"} · {formatHandledAt(report.HandledAt)}
                </p>
              </>
            ) : (
              <>
                <label htmlFor="incidentHandleNote" className="sr-only">
                  Ghi chú xử lý
                </label>
                <textarea
                  id="incidentHandleNote"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú xử lý"
                  className="mt-2 w-full resize-none rounded-[4px] border border-[#b9ab90] bg-white px-3 py-2 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
                />
                <p className={`mt-1 text-right text-xs tabular-nums ${noteTooLong ? "text-[#c0262d]" : "text-[#6b6055]"}`}>
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
          </section>
        )}
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
