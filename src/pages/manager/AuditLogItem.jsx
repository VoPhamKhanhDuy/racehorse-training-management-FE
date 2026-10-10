import { Activity, ClipboardList, FolderOpen, HeartPulse, History, Package, UserCog } from "lucide-react";
import { formatRelativeTime } from "../../utils/date";

// Icon theo nhóm hành động (khớp AUDIT_CATEGORIES trong auditService)
const CATEGORY_ICONS = {
  "Tài khoản": UserCog,
  "Hồ sơ ngựa": FolderOpen,
  "Sức khỏe": HeartPulse,
  "Giáo án": ClipboardList,
  "Buổi tập": Activity,
  "Vật tư": Package,
};

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

// 1 dòng trên timeline: icon tròn + câu "<người> đã <hành động> <đối tượng>" + thời gian bên phải.
// Đường kẻ dọc mảnh nối từ icon dòng này xuống icon dòng sau (ẩn ở dòng cuối).
export default function AuditLogItem({ log, isLast }) {
  const Icon = CATEGORY_ICONS[log.category] ?? History;

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-stone/20" />}
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone/20 bg-white text-stone">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 pt-1 sm:flex sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">{log.actorName}</span> đã {lowerFirst(log.HanhDong)}{" "}
            {log.targetPrefix && `${log.targetPrefix} `}
            <span className="font-medium">{log.targetName}</span>
          </p>
          <p className="mt-0.5 text-xs text-stone">{log.category}</p>
        </div>
        <time dateTime={log.ThoiGian} className="mt-1 block text-xs whitespace-nowrap text-stone sm:mt-0.5 sm:text-sm">
          {formatRelativeTime(log.ThoiGian)}
        </time>
      </div>
    </li>
  );
}
