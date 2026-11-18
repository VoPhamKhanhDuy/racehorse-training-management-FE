import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import { getIncidentTypeText } from "./IncidentReportRow";
import { formatDate } from "../../utils/date";

const BLOCK = "border-b border-stone/15 py-4 last:border-b-0";
const LABEL = "text-xs text-stone";

// Ngăn chi tiết 1 báo cáo sự cố (chỉ xem, không sửa/xóa): loại sự cố, ngày, mô tả đầy đủ, ảnh lớn (ẩn khối nếu không có ảnh).
export default function IncidentDetailDrawer({ report, horse, stable, onClose }) {
  if (!report) return null;
  const name = horse?.Ten ?? `Ngựa #${report.HorseID}`;

  return (
    <Drawer
      open
      label={`Báo cáo sự cố ${name} ngày ${formatDate(report.Ngay)}`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={40} />
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight font-semibold text-ink">{name}</p>
            {stable && <p className="text-sm text-stone">Chuồng {stable}</p>}
          </div>
        </div>
      }
    >
      <section className={BLOCK}>
        <h3 className={LABEL}>Loại sự cố</h3>
        <p className={`mt-1 ${getIncidentTypeText(report.LoaiSuCo)}`}>{report.LoaiSuCo}</p>
      </section>

      <section className={BLOCK}>
        <h3 className={LABEL}>Ngày</h3>
        <p className="mt-1 text-ink tabular-nums">{formatDate(report.Ngay)}</p>
      </section>

      <section className={BLOCK}>
        <h3 className={LABEL}>Mô tả</h3>
        {report.MoTa ? (
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">{report.MoTa}</p>
        ) : (
          <p className="mt-1 text-sm text-stone">Không có mô tả</p>
        )}
      </section>

      {report.HinhAnh && (
        <section className={BLOCK}>
          <h3 className={LABEL}>Hình ảnh</h3>
          <img src={report.HinhAnh} alt={`Ảnh sự cố ${report.LoaiSuCo} – ${name}`} className="mt-2 w-full rounded-[4px] border border-stone/15" />
        </section>
      )}
    </Drawer>
  );
}
