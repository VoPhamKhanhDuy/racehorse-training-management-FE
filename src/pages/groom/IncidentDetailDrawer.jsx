import { useState } from "react";
import { Check, Clock } from "lucide-react";
import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import IncidentStatusBadge from "../../components/IncidentStatusBadge";
import { INCIDENT_STATUS } from "../../data/incidentOptions";
import { formatDate, formatDayMonth } from "../../utils/date";
import { capitalizeFirst } from "../../utils/text";

const SECTION_TITLE = "text-[12px] font-semibold tracking-wide text-[#5a4d3f] uppercase";
const LABEL = "text-xs text-[#6b6055]";

// "YYYY-MM-DDTHH:mm" → "dd/MM HH:mm"
const formatHandledAt = (iso) => (iso ? `${formatDayMonth(iso.slice(0, 10))} ${iso.slice(11, 16)}` : "");

// Ngăn chi tiết 1 báo cáo sự cố của nhân viên chăm sóc (chỉ xem): trạng thái, thông tin, mô tả, ảnh, tiến trình xử lý.
export default function IncidentDetailDrawer({ report, horse, stable, onClose }) {
  const [zoomed, setZoomed] = useState(false);
  if (!report) return null;
  const name = horse?.Ten ?? `Ngựa #${report.HorseID}`;
  const status = report.TrangThai || INCIDENT_STATUS.NEW;
  const inProgress = status === INCIDENT_STATUS.IN_PROGRESS;
  const isDone = status === INCIDENT_STATUS.DONE;
  const handledAt = formatHandledAt(report.HandledAt);

  const steps = [
    { key: "sent", title: "Đã gửi báo cáo", detail: formatDate(report.Ngay), reached: true, active: false },
    {
      key: "taken",
      title: "Tiếp nhận xử lý",
      detail: inProgress || isDone ? report.HandlerName || "Đã có người nhận" : "Đang chờ tiếp nhận",
      reached: inProgress || isDone,
      active: inProgress,
    },
    {
      key: "done",
      title: "Hoàn tất",
      detail: isDone ? handledAt || "Đã xử lý xong" : "Chưa hoàn tất",
      reached: isDone,
      active: false,
      note: isDone ? report.GhiChuXuLy : "",
    },
  ];

  return (
    <>
      <Drawer
        open
        label={`Báo cáo sự cố ${name} ngày ${formatDate(report.Ngay)}`}
        onClose={onClose}
        header={
          <div className="flex items-center gap-3">
            <HorseAvatar horse={horse} size={44} square />
            <div className="min-w-0">
              <p className="truncate font-serif text-lg leading-tight font-semibold text-[#2b2118]">{name}</p>
              <p className="mt-0.5 text-xs text-[#6b6055]">
                {stable ? `Chuồng ${stable} · ` : ""}Mã sự cố #{report.ReportID}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-5 py-5">
          {/* Trạng thái */}
          <div className="flex items-center justify-between rounded-[6px] border border-[#e3d9c6] bg-[#faf7f2] px-4 py-3">
            <span className="text-sm font-medium text-[#4a3f33]">Trạng thái hiện tại</span>
            <IncidentStatusBadge status={status} />
          </div>

          {/* Thông tin */}
          <section>
            <h3 className={SECTION_TITLE}>Thông tin sự cố</h3>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-3.5 rounded-[6px] border border-[#e3d9c6] p-4">
              <div>
                <dt className={LABEL}>Loại sự cố</dt>
                <dd className="mt-1">
                  <span className="inline-flex rounded-[4px] border border-[#dcd2be] bg-[#faf7f2] px-2.5 py-0.5 text-xs font-semibold text-[#4a3f33]">
                    {report.LoaiSuCo}
                  </span>
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Ngày báo</dt>
                <dd className="mt-1 text-sm font-medium text-[#2b2118] tabular-nums">{formatDate(report.Ngay)}</dd>
              </div>
              <div className="col-span-2">
                <dt className={LABEL}>Mô tả</dt>
                <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#2b2118]">
                  {report.MoTa ? capitalizeFirst(report.MoTa) : <span className="text-[#9a8f82]">Không có mô tả</span>}
                </dd>
              </div>
            </dl>
          </section>

          {/* Hình ảnh */}
          {report.HinhAnh && (
            <section>
              <h3 className={SECTION_TITLE}>Hình ảnh hiện trường</h3>
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label="Xem ảnh lớn"
                className="mt-2.5 block w-full cursor-zoom-in overflow-hidden rounded-[6px] border border-[#cfc4ad] bg-[#faf7f2]"
              >
                <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${name}`} className="max-h-[260px] w-full object-cover" />
              </button>
              <p className="mt-1 text-xs text-[#6b6055]">Bấm vào ảnh để xem kích thước đầy đủ.</p>
            </section>
          )}

          {/* Tiến trình */}
          <section>
            <h3 className={SECTION_TITLE}>Tiến trình xử lý</h3>
            <ol className="relative mt-2.5 space-y-3.5 rounded-[6px] border border-[#e3d9c6] p-4 before:absolute before:top-7 before:bottom-7 before:left-[27px] before:w-[2px] before:bg-[#e3d9c6]">
              {steps.map((step) => (
                <li key={step.key} className="relative flex items-start gap-3">
                  <span
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      step.active
                        ? "border-[#c2570c] bg-[#c2570c] text-white"
                        : step.reached
                          ? "border-[#4d6b2a] bg-[#4d6b2a] text-white"
                          : "border-[#cfc4ad] bg-white text-[#9a8f82]"
                    }`}
                    aria-hidden="true"
                  >
                    {step.reached && !step.active ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${step.reached ? "font-semibold text-[#2b2118]" : "text-[#8a7f72]"}`}>{step.title}</p>
                    <p className="text-xs text-[#6b6055]">{step.detail}</p>
                    {step.note && <p className="mt-1.5 rounded-[4px] bg-[#faf7f2] px-3 py-1.5 text-xs leading-relaxed whitespace-pre-line text-[#4a3f33]">{step.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Drawer>

      {zoomed && (
        <div className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-[#232328]/75 p-4" onClick={() => setZoomed(false)} role="presentation">
          <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${name}`} className="max-h-full max-w-full rounded-[6px] bg-white object-contain shadow-2xl" />
        </div>
      )}
    </>
  );
}
