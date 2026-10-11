import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { ALERT_TYPES } from "../../utils/healthAlerts";

// Việc liên quan vắc-xin → sang Lịch tiêm phòng; còn lại → ghi lần khám
const VACCINE_TYPES = [ALERT_TYPES.VACCINE_OVERDUE, ALERT_TYPES.VACCINE_DUE_SOON];

// 1 việc trong mục "Cần xử lý": ảnh 40px | tên + lý do | "+N việc khác" + nút phụ viền cam
export default function OverviewActionItem({ horse, alert, otherCount }) {
  const isVaccine = VACCINE_TYPES.includes(alert.type);
  const action = isVaccine
    ? { label: "Xem lịch tiêm", to: `/vet/vaccinations?horse=${horse.HorseID}` }
    : { label: "Ghi lần khám", to: `/vet/exams/new?horse=${horse.HorseID}` };

  return (
    <li className="flex min-h-[64px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-stone/15 py-3 last:border-b-0 sm:flex-nowrap">
      <HorseAvatar horse={horse} size={40} />
      {/* Màn hẹp: nút xuống dòng riêng (basis gần 100%) để lý do không bị ép hẹp */}
      <div className="min-w-0 flex-1 basis-[calc(100%-56px)] sm:basis-auto">
        <p className="font-serif text-[17px] leading-tight font-semibold text-ink">{horse.Ten}</p>
        <p className="text-sm text-stone">{alert.message}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {otherCount > 0 && <span className="text-xs whitespace-nowrap text-stone">+{otherCount} việc khác</span>}
        <Link
          to={action.to}
          className="rounded-sm border border-brass px-3 py-1.5 text-sm font-medium whitespace-nowrap text-brass-deep transition-colors hover:bg-brass/10"
        >
          {action.label}
        </Link>
      </div>
    </li>
  );
}
