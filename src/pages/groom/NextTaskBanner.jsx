import HorseAvatar from "../../components/HorseAvatar";
import { formatDayMonth } from "../../utils/date";

// Khối "Việc tiếp theo": 1 dòng lớn, nền be + vạch trái cam 4px — giờ · loại việc (serif) · ngựa + chuồng ·
// nút "Xác nhận xong". task = null (hết việc) → câu chúc mừng. isBacklog: việc tồn → ghi thêm "Tồn từ dd/MM".
export default function NextTaskBanner({ task, gio, horse, horseName, stable, late, isBacklog, saving, onConfirm }) {
  return (
    <section
      aria-label="Việc tiếp theo"
      className="rounded-[4px] border border-l-4 border-[#d9cfba] border-l-[#c2570c] bg-[#fbf3e6] px-5 py-4"
    >
      <h2 className="text-[13px] font-semibold text-[#c2570c]">Việc tiếp theo</h2>
      {task ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="font-serif text-[28px] leading-none font-semibold text-[#c2570c] tabular-nums">{gio}</span>
          <span className="font-serif text-xl font-semibold text-[#2b2118]">{task.LoaiViec}</span>
          <span className="flex min-w-0 items-center gap-3">
            <HorseAvatar horse={horse} size={44} square />
            <span className="min-w-0">
              <span className="block font-serif text-base leading-tight font-semibold text-[#2b2118]">{horseName}</span>
              <span className="block text-[13px] text-[#6b6055]">
                {stable && `Chuồng ${stable}`}
                {isBacklog && (
                  <span className="font-semibold text-[#c0262d]">
                    {stable ? " · " : ""}Tồn từ {formatDayMonth(task.Ngay)}
                  </span>
                )}
                {late && <span className="font-semibold text-[#c2570c]">{stable || isBacklog ? " · " : ""}Trễ</span>}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => onConfirm(task)}
            disabled={saving}
            aria-label={`Hoàn thành ${task.LoaiViec} cho ${horseName}`}
            className="h-10 w-full cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c] disabled:cursor-wait disabled:opacity-60 md:ml-auto md:w-auto"
          >
            Hoàn thành
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#4a3f33]">Hôm nay bạn đã hoàn thành mọi công việc.</p>
      )}
    </section>
  );
}
