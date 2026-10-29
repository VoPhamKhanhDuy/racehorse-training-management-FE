import { formatDate } from "../utils/date";

// Dải cảnh báo ngựa đang khóa tập (TRAININGLOCK chưa gỡ): nền be nhạt, viền trái cam.
// hint: dòng nhắc bên dưới — ở form giáo án chỉ nhắc cân nhắc, ở form lịch tập thì báo không xếp được.
// horseName (tùy chọn): ghi tên ngựa ở đầu câu — dùng ở trang danh sách nhiều ngựa (lịch tập, đăng ký thi đấu).
export default function TrainingLockNotice({ lock, lockedByName, horseName, hint = "Nên cân nhắc trước khi lập giáo án mới." }) {
  return (
    <div role="note" className="rounded-sm border-l-2 border-brass bg-brass/10 px-4 py-3 text-sm">
      <p className="text-ink">
        {horseName ? (
          <>
            <span className="font-semibold">{horseName}</span> đang khóa tập
          </>
        ) : (
          "Đang khóa tập"
        )}{" "}
        từ {formatDate(lock.NgayDat)}
        {lockedByName ? ` bởi ${lockedByName}` : ""}. Lý do: {lock.LyDo}
      </p>
      <p className="mt-0.5 text-stone">{hint}</p>
    </div>
  );
}
