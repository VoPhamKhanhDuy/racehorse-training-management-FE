import { Link } from "react-router-dom";
import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import { NO_INJURY } from "../../data/medicalRecordOptions";
import { formatDate } from "../../utils/date";

const BLOCK = "border-b border-stone/15 py-4 last:border-b-0";
const LABEL = "text-xs text-stone";

// Ngăn chi tiết 1 lần khám: chẩn đoán, vị trí chấn thương, phác đồ (đầy đủ) và lệnh khóa đặt cùng ngày khám.
// canEdit: bác sĩ đang đăng nhập là người ghi → hiện nút "Sửa". Không có nút xóa (bệnh án không được xóa).
export default function ExamDetailDrawer({ record, horse, vetName, lock, canEdit, onClose }) {
  if (!record) return null;
  const hasInjury = record.ViTriChanThuong && record.ViTriChanThuong !== NO_INJURY;

  return (
    <Drawer
      open
      label={`Bệnh án ${horse?.Ten ?? ""} ngày ${formatDate(record.Ngay)}`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={40} />
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight font-semibold text-ink">{horse?.Ten ?? `Ngựa #${record.HorseID}`}</p>
            <p className="text-sm text-stone">
              {formatDate(record.Ngay)} · BS. {vetName ?? "Không rõ"}
            </p>
          </div>
        </div>
      }
      footer={
        canEdit && (
          <Link
            to={`/vet/exams/${record.RecordID}/edit`}
            className="rounded-sm border border-stone/30 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
          >
            Sửa
          </Link>
        )
      }
    >
      <section className={BLOCK}>
        <h3 className={LABEL}>Chẩn đoán</h3>
        <p className="mt-1 font-medium text-ink">{record.ChanDoan}</p>
      </section>

      {hasInjury && (
        <section className={BLOCK}>
          <h3 className={LABEL}>Vị trí chấn thương</h3>
          <p className="mt-1 text-ink">{record.ViTriChanThuong}</p>
        </section>
      )}

      <section className={BLOCK}>
        <h3 className={LABEL}>Phác đồ điều trị</h3>
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">{record.PhacDo}</p>
      </section>

      {lock && (
        <section className={BLOCK}>
          <h3 className={LABEL}>Lệnh khóa huấn luyện liên quan</h3>
          <p className="mt-1 text-sm text-ink">
            Đã đặt lệnh khóa từ {formatDate(lock.NgayDat)}
            <Link
              to={`/vet/locks?horse=${record.HorseID}`}
              className="ml-2 font-medium text-brass-deep underline-offset-2 hover:underline"
            >
              Xem lệnh khóa
            </Link>
          </p>
        </section>
      )}
    </Drawer>
  );
}
