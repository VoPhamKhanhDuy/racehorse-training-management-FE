import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import HorseAvatar from "../../components/HorseAvatar";
import { examOutcome } from "../../utils/examOutcome";
import { formatDate } from "../../utils/date";

const LABEL = "text-xs text-[#6b6055]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:border-stone/50";

function Field({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-0.5 text-sm text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Chi tiết 1 lần khám — MODAL giữa màn hình (rộng ≤ 560px): đầu = ảnh + tên + ngày khám; Chẩn đoán | Bác sĩ khám; Kết quả khám; Vị trí chấn thương;
// Phác đồ điều trị; lệnh khóa đặt cùng ngày khám (nếu có). Chân: "Đóng" (+ "Sửa" nếu bác sĩ đang đăng nhập là người ghi). Không có nút xóa.
export default function ExamDetailDialog({ record, horse, vetName, lock, canEdit, onClose }) {
  const { result, location, abnormal } = examOutcome(record);
  const name = horse?.Ten ?? `Ngựa #${record.HorseID}`;

  const header = (
    <div className="flex items-center gap-3">
      <HorseAvatar horse={horse} size={40} square />
      <div className="min-w-0">
        <h2 className="truncate font-serif text-lg leading-tight font-semibold text-[#2b2118]">{name}</h2>
        <p className="text-sm text-[#6b6055]">Khám ngày {formatDate(record.Ngay)}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
        Đóng
      </button>
      {canEdit && (
        <Link to={`/vet/exams/${record.RecordID}/edit`} className={OUTLINE_BUTTON}>
          Sửa
        </Link>
      )}
    </div>
  );

  return (
    <CenterDialog label={`Bệnh án ${name} ngày ${formatDate(record.Ngay)}`} header={header} footer={footer} onClose={onClose} narrow>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Field label="Chẩn đoán">{record.ChanDoan || "—"}</Field>
        <Field label="Bác sĩ khám">{vetName ?? "Không rõ"}</Field>
        <Field label="Kết quả khám" wide>
          {result ? (
            <span className={abnormal ? "font-semibold text-[#c0262d]" : ""}>{result}</span>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Vị trí chấn thương" wide>
          {location || "—"}
        </Field>
        <Field label="Phác đồ điều trị" wide>
          <span className="leading-relaxed whitespace-pre-line">{record.PhacDo || "—"}</span>
        </Field>
        {lock && (
          <Field label="Lệnh khóa huấn luyện liên quan" wide>
            Đã đặt lệnh khóa từ {formatDate(lock.NgayDat)}
            <Link to={`/vet/locks?horse=${record.HorseID}`} className="ml-2 font-semibold text-[#c2570c] hover:underline">
              Xem lệnh khóa
            </Link>
          </Field>
        )}
      </dl>
    </CenterDialog>
  );
}
