import HorseAvatar from "../../components/HorseAvatar";
import TrainingLockNotice from "../../components/TrainingLockNotice";
import { formatDate, formatHorseAge } from "../../utils/date";
import { genderLabel } from "../../utils/horseGender";
import { getHealthLabel, getHealthStyle } from "../../utils/healthStatusStyles";

const RECENT_COUNT = 3;

// Thẻ ngữ cảnh bên phải form khám bệnh — cập nhật khi đổi ngựa: thông tin ngựa, tình trạng sức khỏe hiện tại,
// lệnh khóa huấn luyện đang hiệu lực, và 3 lần khám gần nhất. editingRecordId: bệnh án đang sửa (đánh dấu).
// note: dòng nhắc xám tùy form (vd sẽ tự động khóa huấn luyện / sẽ chuyển tình trạng sang Đang điều trị).
export default function ExamFormContext({ horse, health, lock, lockedByName, records, editingRecordId, note }) {
  if (!horse) {
    return <p className="py-6 text-center text-sm text-stone">Chọn ngựa để xem tình trạng sức khỏe và các lần khám gần nhất.</p>;
  }

  const facts = [horse.Giong, formatHorseAge(horse.NgaySinh), genderLabel(horse.GioiTinh)].filter(Boolean);
  const recent = records.slice(0, RECENT_COUNT);

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 items-center gap-4">
        <HorseAvatar horse={horse} size={56} />
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold text-ink">{horse.Ten}</h2>
          <p className="text-sm text-stone">{facts.join(" · ")}</p>
        </div>
      </div>

      <p className="text-sm">
        <span className="text-stone">Tình trạng sức khỏe: </span>
        <span className={`font-medium ${getHealthStyle(health?.TrangThai).text}`}>{getHealthLabel(health?.TrangThai)}</span>
        {health?.NgayCapNhat && <span className="text-stone"> · cập nhật {formatDate(health.NgayCapNhat)}</span>}
      </p>

      {lock && (
        <TrainingLockNotice lock={lock} lockedByName={lockedByName} hint="Gỡ hoặc giữ lệnh khóa ở mục Lệnh khóa huấn luyện." />
      )}

      {note && <p className="text-sm text-stone">{note}</p>}

      <section aria-label="Lần khám gần nhất" className="border-t border-stone/15 pt-4">
        <h3 className="font-serif text-base font-semibold text-ink">Lần khám gần nhất</h3>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-stone">Ngựa này chưa có lần khám nào.</p>
        ) : (
          <ul className="mt-1">
            {recent.map((record) => (
              <li key={record.RecordID} className="border-b border-stone/15 py-2 text-sm last:border-b-0">
                <span className="text-stone tabular-nums">{formatDate(record.Ngay)}</span>
                {record.RecordID === editingRecordId && <span className="ml-1.5 text-xs text-brass-deep">(đang sửa)</span>}
                <span className="block truncate text-ink" title={record.ChanDoan}>
                  {record.ChanDoan}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
