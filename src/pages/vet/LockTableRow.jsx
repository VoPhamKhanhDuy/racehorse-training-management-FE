import HorseAvatar from "../../components/HorseAvatar";
import { formatDate } from "../../utils/date";
import { getLockDays } from "../../utils/trainingLock";

// Ô bảng: kẻ ô 1px #E3E3E3 (ngang + dọc, ô cuối không kẻ dọc), padding 12px 16px, căn giữa dọc, nội dung dài cắt 1 dòng
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// 1 lệnh khóa = 1 hàng: STT | Ngựa | Lý do | Ngày đặt | Đã khóa | Ngày gỡ | Bác sĩ đặt | Trạng thái | Thao tác.
// Trạng thái: "Đang khóa" chữ đỏ đậm (không chấm); "Đã gỡ" chữ xám. Thao tác: đang khóa → "Gỡ khóa" (link cam); đã gỡ → "Xem".
export default function LockTableRow({ index, lock, horse, vetName, onRelease, onView }) {
  const active = !lock.NgayGo;
  const name = horse?.Ten ?? `Ngựa #${lock.HorseID}`;
  const empty = <span className="text-[#B5B5B5]">—</span>;

  return (
    <tr className="h-14 bg-white transition-colors hover:bg-[#FAFAFA]">
      <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index}</td>
      <td className={CELL}>
        <span className="flex min-w-0 items-center gap-2.5">
          <HorseAvatar horse={horse} size={32} square />
          <span className="truncate font-semibold" title={name}>
            {name}
          </span>
        </span>
      </td>
      <td className={CELL}>
        <span className="block truncate" title={lock.LyDo}>
          {lock.LyDo || empty}
        </span>
      </td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(lock.NgayDat)}</td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{getLockDays(lock)} ngày</td>
      <td className={`${CELL} whitespace-nowrap tabular-nums`}>{lock.NgayGo ? formatDate(lock.NgayGo) : empty}</td>
      <td className={CELL}>
        <span className="block truncate" title={vetName ?? undefined}>
          {vetName ?? empty}
        </span>
      </td>
      <td className={CELL}>
        {active ? (
          <span className="font-semibold whitespace-nowrap text-[#c0262d]">Đang khóa</span>
        ) : (
          <span className="whitespace-nowrap text-[#6b6b6b]">Đã gỡ</span>
        )}
      </td>
      <td className={CELL}>
        <button
          type="button"
          onClick={() => (active ? onRelease(lock) : onView(lock))}
          className="cursor-pointer font-semibold whitespace-nowrap text-[#c2570c] hover:underline"
        >
          {active ? "Gỡ khóa" : "Xem"}
        </button>
      </td>
    </tr>
  );
}
