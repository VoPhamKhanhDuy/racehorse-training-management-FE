import { formatDate } from "../../utils/date";

// Dải cảnh báo ngựa đang khóa tập (TRAININGLOCK chưa gỡ): nền be nhạt, viền trái cam.
// hint: dòng nhắc bên dưới — ở form giáo án chỉ nhắc cân nhắc, ở form lịch tập thì báo không xếp được.
export default function TrainingLockNotice({ lock, lockedByName, hint = "Nên cân nhắc trước khi lập giáo án mới." }) {
  return (
    <div role="note" className="rounded-sm border-l-2 border-brass bg-brass/10 px-4 py-3 text-sm">
      <p className="text-ink">
        Đang khóa tập từ {formatDate(lock.NgayKhoa)}
        {lockedByName ? ` bởi ${lockedByName}` : ""}. Lý do: {lock.LyDo}
      </p>
      <p className="mt-0.5 text-stone">{hint}</p>
    </div>
  );
}
