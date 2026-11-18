import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, ZoomIn } from "lucide-react";
import CenterDialog from "./CenterDialog";
import ConfirmDialog from "./ConfirmDialog";
import HorseAvatar from "./HorseAvatar";
import { HEALTH_INCIDENT_TYPES, INCIDENT_STATUS } from "../data/incidentOptions";
import { formatDate, formatDayMonth } from "../utils/date";
import { capitalizeFirst } from "../utils/text";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-[#cfc4ad] bg-white px-5 text-sm font-semibold text-[#2b2118] transition-colors hover:border-[#9e8e72] hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "text-xs font-medium text-[#6b6055]";
const GROUP_TITLE = "text-[13px] font-semibold tracking-wide text-[#5a4d3f] uppercase";
const DISABLED_LINK =
  "inline-flex h-10 cursor-not-allowed items-center rounded-[4px] border border-[#e3d9c6] bg-[#faf7f2] px-5 text-sm font-semibold text-[#9a8f82]";

const STATUS_BADGE = {
  [INCIDENT_STATUS.NEW]: {
    wrap: "border-[#c0262d]/25 bg-[#c0262d]/10 text-[#b4232a]",
    dot: "bg-[#c0262d]",
  },
  [INCIDENT_STATUS.IN_PROGRESS]: {
    wrap: "border-[#c2570c]/25 bg-[#c2570c]/10 text-[#a8480a]",
    dot: "bg-[#c2570c]",
  },
  [INCIDENT_STATUS.DONE]: {
    wrap: "border-[#4d6b2a]/25 bg-[#4d6b2a]/12 text-[#3a541d]",
    dot: "bg-[#4d6b2a]",
  },
};

// Mỗi trạng thái hiện đúng 1 nút chính: Mới → "Nhận xử lý"; Đang xử lý (do chính mình nhận) → "Hoàn tất xử lý"; Đã xử lý → không còn nút
const NEXT_ACTION = {
  [INCIDENT_STATUS.NEW]: { status: INCIDENT_STATUS.IN_PROGRESS, label: "Nhận xử lý" },
  [INCIDENT_STATUS.IN_PROGRESS]: { status: INCIDENT_STATUS.DONE, label: "Hoàn tất xử lý" },
};

// "YYYY-MM-DDTHH:mm" → "dd/MM HH:mm" (không có thì "")
const formatHandledAt = (isoDateTime) => (isoDateTime ? `${formatDayMonth(isoDateTime.slice(0, 10))} ${isoDateTime.slice(11, 16)}` : "");

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Chi tiết sự cố — MODAL giữa màn hình DÙNG CHUNG cho Thú y (role="veterinarian") và Quản lý (role="club_manager"), rộng ≤ 620px
export default function IncidentDetailDialog({ role, userId, report, horse, stable, lockedSince, onClose, onUpdate }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);

  const isHealth = HEALTH_INCIDENT_TYPES.includes(report.LoaiSuCo);
  const isVet = role === "veterinarian";
  const canTakeType = isVet ? isHealth : true; // Thú y chỉ sức khỏe; Quản lý mọi loại
  // Đã có người nhận và không phải mình → chỉ xem
  const heldByOther = report.TrangThai !== INCIDENT_STATUS.NEW && report.HandledBy != null && report.HandledBy !== userId;
  const action = canTakeType && !heldByOther ? NEXT_ACTION[report.TrangThai] : undefined;
  const isNew = report.TrangThai === INCIDENT_STATUS.NEW;
  const inProgress = report.TrangThai === INCIDENT_STATUS.IN_PROGRESS;
  const isDone = report.TrangThai === INCIDENT_STATUS.DONE;
  const relatedEnabled = inProgress && !heldByOther;

  const badge = STATUS_BADGE[report.TrangThai] ?? {
    wrap: "border-[#d6ccb8] bg-[#f6f1e7] text-[#4a3f33]",
    dot: "bg-[#6b6055]",
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      await onUpdate(report, { TrangThai: pendingAction.status, GhiChuXuLy: report.GhiChuXuLy ?? "" });
      setPendingAction(null);
    } catch (err) {
      setPendingAction(null);
      setError(err.message || "Không cập nhật được, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handledAt = formatHandledAt(report.HandledAt);
  const steps = [
    {
      key: "reported",
      title: "Đã gửi báo cáo",
      detail: `${report.ReporterName} · ${formatDayMonth(report.Ngay)}`,
      current: isNew,
      reached: true,
    },
    {
      key: "accepted",
      title: "Tiếp nhận xử lý",
      detail:
        inProgress || isDone
          ? `${report.HandlerName ?? "—"}${inProgress && handledAt ? ` · ${handledAt}` : ""}`
          : "Chưa có người nhận xử lý",
      current: inProgress,
      reached: inProgress || isDone,
    },
    {
      key: "done",
      title: "Hoàn tất xử lý",
      detail: isDone ? (handledAt ? `Hoàn tất lúc ${handledAt}` : "Đã xử lý xong") : "Chưa hoàn tất",
      current: isDone,
      reached: isDone,
      note: isDone ? report.GhiChuXuLy : "",
    },
  ];

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 pr-2">
      <div className="flex min-w-0 items-center gap-3.5">
        <HorseAvatar horse={horse} size={44} square />
        <div className="min-w-0">
          <h2 className="truncate font-serif text-xl leading-tight font-semibold text-[#2b2118]">{report.HorseName}</h2>
          <p className="mt-0.5 text-xs text-[#6b6055]">
            Báo ngày {formatDate(report.Ngay)} · Mã sự cố #{report.ReportID}
          </p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.wrap}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} aria-hidden="true" />
        {report.TrangThai}
      </span>
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
            <button type="button" disabled={saving} onClick={() => setPendingAction(action)} className="btn-primary">
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
        {/* Khối 1: Thông tin chung */}
        <section>
          <h3 className={GROUP_TITLE}>Thông tin sự cố</h3>
          <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-3.5 rounded-[6px] border border-[#e3d9c6] bg-[#faf7f2]/80 p-4">
            <Field label="Người báo cáo">{report.ReporterName}</Field>
            <Field label="Vị trí chuồng">{stable ? `Chuồng ${stable}` : "—"}</Field>
            <Field label="Phân loại sự cố">
              <span className="inline-flex items-center rounded-[4px] border border-[#d6ccb8] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#4a3f33]">
                {report.LoaiSuCo}
              </span>
            </Field>
            <Field label="Người phụ trách">{report.HandlerName || "Chưa phân công"}</Field>
          </dl>

          {/* Mô tả & Hình ảnh */}
          <div className="mt-3 rounded-[6px] border border-[#e3d9c6] bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className={LABEL}>Mô tả chi tiết</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">
                  {report.MoTa ? capitalizeFirst(report.MoTa) : <span className="text-[#6b6055]">Không có mô tả</span>}
                </p>
              </div>

              {report.HinhAnh && (
                <div className="shrink-0">
                  <p className={`${LABEL} mb-1.5`}>Hình ảnh hiện trường</p>
                  <button
                    type="button"
                    onClick={() => setZoomed(true)}
                    aria-label="Xem ảnh lớn"
                    className="group relative block cursor-zoom-in overflow-hidden rounded-[6px] border border-[#cfc4ad] bg-[#faf7f2]"
                  >
                    <img
                      src={report.HinhAnh}
                      alt={`Ảnh sự cố ${report.LoaiSuCo} – ${report.HorseName}`}
                      className="h-28 w-40 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-[4px] bg-[#2b2118]/75 px-2 py-0.5 text-[11px] font-medium text-white">
                      <ZoomIn className="h-3 w-3" aria-hidden="true" />
                      Phóng to
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Khối 2: Tiến trình xử lý (Timeline 3 bước) */}
        <section className="mt-5">
          <h3 className={GROUP_TITLE}>Tiến trình xử lý</h3>
          <div className="mt-2.5 rounded-[6px] border border-[#e3d9c6] bg-[#faf7f2]/50 p-4">
            <ol className="relative space-y-3.5 before:absolute before:top-2.5 before:bottom-2.5 before:left-[11px] before:w-[2px] before:bg-[#dfd6c5]">
              {steps.map((step) => {
                const isCompleted = step.reached && (!step.current || isDone);
                return (
                  <li key={step.key} className="relative flex items-start gap-3 pl-8">
                    <span
                      className={`absolute top-0.5 left-0 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                        isCompleted
                          ? "border-[#4d6b2a] bg-[#4d6b2a] text-white"
                          : step.current
                            ? "border-[#c2570c] bg-[#c2570c] text-white"
                            : "border-[#cfc4ad] bg-white text-[#9a8f82]"
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <span className={`text-sm ${step.reached ? "font-semibold text-[#2b2118]" : "text-[#8a7f72]"}`}>{step.title}</span>
                      <span className={`text-xs ${step.reached ? "font-medium text-[#5a4d3f]" : "text-[#9a8f82]"}`}>{step.detail}</span>
                      {step.note && (
                        <p className="mt-1 w-full rounded-[4px] bg-white px-3 py-1.5 text-xs leading-relaxed whitespace-pre-line text-[#4a3f33]">
                          {step.note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Khối 3: Trạng thái xử lý */}
        <section className="mt-5">
          <h3 className={GROUP_TITLE}>Trạng thái xử lý</h3>
          <div
            className={`mt-2.5 rounded-[6px] border px-4 py-3 text-sm ${
              isDone
                ? "border-[#4d6b2a]/25 bg-[#4d6b2a]/8 text-[#3a541d]"
                : inProgress
                  ? "border-[#c2570c]/25 bg-[#c2570c]/8 text-[#7a3405]"
                  : "border-[#e3d9c6] bg-[#faf7f2] text-[#4a3f33]"
            }`}
          >
            {isNew && (
              <p>{canTakeType ? "Sự cố đang chờ tiếp nhận. Nhấn 'Nhận xử lý' bên dưới để bắt đầu xử lý." : "Sự cố này thuộc phạm vi xử lý của Quản lý CLB."}</p>
            )}
            {inProgress && heldByOther && (
              <p className="font-medium">Sự cố đang được xử lý bởi {report.HandlerName ?? "nhân sự khác"}.</p>
            )}
            {inProgress && !heldByOther && (
              <div className="space-y-1">
                {lockedSince && <p className="font-semibold text-[#b4232a]">Ngựa đang có lệnh khóa tập từ ngày {formatDayMonth(lockedSince)}.</p>}
                <p>Bạn đang phụ trách sự cố này. Nhấn 'Hoàn tất xử lý' khi đã kiểm tra và xử lý xong.</p>
              </div>
            )}
            {isDone && <p className="font-medium">Sự cố đã được xử lý và đóng hồ sơ hoàn tất.</p>}
          </div>
        </section>

        {/* Việc liên quan: chỉ Thú y + sự cố sức khỏe, ẩn khi Đã xử lý */}
        {isVet && isHealth && !isDone && (
          <section className="mt-5">
            <h3 className={GROUP_TITLE}>Nghiệp vụ y tế liên quan</h3>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {relatedEnabled ? (
                <>
                  <Link to={`/vet/exams/new?horse=${report.HorseID}`} className={OUTLINE_BUTTON}>
                    Ghi lần khám bệnh
                  </Link>
                  <Link to={`/vet/locks/new?horse=${report.HorseID}`} className={OUTLINE_BUTTON}>
                    Đặt lệnh khóa huấn luyện
                  </Link>
                </>
              ) : (
                <>
                  <span aria-disabled="true" className={DISABLED_LINK}>
                    Ghi lần khám bệnh
                  </span>
                  <span aria-disabled="true" className={DISABLED_LINK}>
                    Đặt lệnh khóa huấn luyện
                  </span>
                </>
              )}
            </div>
            {!relatedEnabled && (
              <p className="mt-2 text-xs text-[#6b6055]">{isNew ? "Nhận xử lý sự cố trước để thực hiện các nghiệp vụ này." : "Chỉ người đang nhận xử lý mới thực hiện được."}</p>
            )}
          </section>
        )}
      </CenterDialog>

      {zoomed && report.HinhAnh && (
        <div className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-[#232328]/75 p-4" onClick={() => setZoomed(false)} role="presentation">
          <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${report.HorseName}`} className="max-h-full max-w-full rounded-[6px] bg-white object-contain shadow-2xl" />
        </div>
      )}

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
