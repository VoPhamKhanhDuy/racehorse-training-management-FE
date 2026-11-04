import { Link } from "react-router-dom";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDate, formatHorseAge } from "../../utils/date";
import { genderLabel } from "../../utils/horseGender";
import { getHealthLabel, getHealthStyle } from "../../utils/healthStatusStyles";

const RECENT_COUNT = 3;

// Khung thông tin ngựa bên phải form Ghi lần khám — cập nhật khi đổi ngựa: thông tin ngựa, tình trạng sức khỏe hiện tại,
// lệnh khóa huấn luyện đang hiệu lực, và 3 lần khám gần nhất. editingRecordId: bệnh án đang sửa (đánh dấu).
// note: dòng nhắc tùy form (vd sẽ tự động khóa huấn luyện). Cùng props với ExamFormContext (dùng ở form khóa huấn luyện).
export default function ExamHorsePanel({ horse, health, lock, lockedByName, records, editingRecordId, note }) {
  if (!horse) {
    return <p className="py-6 text-center text-sm text-[#4a3f33]">Chọn ngựa để xem tình trạng sức khỏe và các lần khám gần nhất.</p>;
  }

  const facts = [horse.Giong, formatHorseAge(horse.NgaySinh), genderLabel(horse.GioiTinh)].filter(Boolean);
  const recent = records.slice(0, RECENT_COUNT);

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 items-center gap-4">
        <HorseAvatar horse={horse} size={64} square />
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-semibold text-[#2b2118]">{horse.Ten}</h2>
          <p className="text-sm text-[#4a3f33]">{facts.join(" · ")}</p>
        </div>
      </div>

      <p className="text-sm text-[#2b2118]">
        Tình trạng sức khỏe:{" "}
        <span className={`font-semibold ${getHealthStyle(health?.TrangThai).text}`}>{getHealthLabel(health?.TrangThai)}</span>
        {health?.NgayCapNhat && <span className="text-[13px] text-[#6b6055]"> · cập nhật {formatDate(health.NgayCapNhat)}</span>}
      </p>

      {lock && (
        <div role="note" className="rounded-[4px] border border-l-4 border-[#d9cfba] border-l-[#c0262d] bg-[#fbf3e6] px-4 py-3 text-sm text-[#2b2118]">
          <p>
            Đang khóa tập từ {formatDate(lock.NgayDat)}
            {lockedByName ? ` bởi ${lockedByName}` : ""}. Lý do: {lock.LyDo}
          </p>
          <p className="mt-1">
            Gỡ hoặc giữ lệnh khóa ở mục{" "}
            <Link
              to="/vet/locks"
              className="font-semibold text-[#c2570c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
            >
              Lệnh khóa huấn luyện
            </Link>
            .
          </p>
        </div>
      )}

      {note && <p className="text-sm text-[#4a3f33]">{note}</p>}

      <section aria-label="Lần khám gần nhất" className="border-t border-[#ece5d6] pt-4">
        <h3 className="font-serif text-base font-semibold text-[#2b2118]">Lần khám gần nhất</h3>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-[#4a3f33]">Ngựa này chưa có lần khám nào.</p>
        ) : (
          <ul className="mt-1">
            {recent.map((record) => (
              <li key={record.RecordID} className="border-b border-[#ece5d6] py-2.5 last:border-b-0">
                <span className="text-[13px] font-semibold text-[#6b6055] tabular-nums">{formatDate(record.Ngay)}</span>
                {record.RecordID === editingRecordId && <span className="ml-1.5 text-[13px] font-semibold text-[#c2570c]">(đang sửa)</span>}
                <span className="block truncate text-sm text-[#2b2118]" title={record.ChanDoan}>
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
