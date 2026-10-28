import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { ALERT_TYPES } from "../../utils/healthAlerts";

// Việc liên quan vắc-xin → sang Lịch tiêm phòng; còn lại → ghi lần khám
const VACCINE_TYPES = [ALERT_TYPES.VACCINE_OVERDUE, ALERT_TYPES.VACCINE_DUE_SOON];

// Làm nổi bật cụm quan trọng trong câu cảnh báo (chỉ định dạng chữ, không đổi nội dung): "quá hạn N ngày" đỏ, "Cần tái khám" cam
const HIGHLIGHT = /(quá hạn \d+ ngày|Cần tái khám)/;
function AlertText({ message }) {
  return message.split(HIGHLIGHT).map((part, index) => {
    if (/^quá hạn \d+ ngày$/.test(part)) {
      return (
        <span key={index} className="font-semibold text-[#c0262d]">
          {part}
        </span>
      );
    }
    if (part === "Cần tái khám") {
      return (
        <span key={index} className="font-semibold text-[#c2570c]">
          {part}
        </span>
      );
    }
    return part;
  });
}

// 1 việc trong mục "Cần xử lý": ảnh 44px | tên + lý do | "+N việc khác" + nút hành động viền cam
export default function OverviewActionItem({ horse, alert, otherCount }) {
  const isVaccine = VACCINE_TYPES.includes(alert.type);
  const action = isVaccine
    ? { label: "Xem lịch tiêm", to: `/vet/vaccinations?horse=${horse.HorseID}` }
    : { label: "Ghi lần khám", to: `/vet/exams/new?horse=${horse.HorseID}` };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#d9cfba] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#f0efec] sm:flex-nowrap">
      <HorseAvatar horse={horse} size={44} square />
      {/* Màn hẹp: nút xuống dòng riêng (basis gần 100%) để lý do không bị ép hẹp */}
      <div className="min-w-0 flex-1 basis-[calc(100%-60px)] sm:basis-auto">
        <p className="font-serif text-[17px] leading-tight font-semibold text-[#2b2118]">{horse.Ten}</p>
        <p className="text-sm text-[#4a3f33]">
          <AlertText message={alert.message} />
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {otherCount > 0 && <span className="text-[13px] whitespace-nowrap text-[#6b6055]">+{otherCount} việc khác</span>}
        <Link
          to={action.to}
          className="inline-flex h-9 items-center rounded-[4px] border border-[#c2570c] bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#c2570c] transition-colors hover:bg-[#fbf3e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
        >
          {action.label}
        </Link>
      </div>
    </li>
  );
}
