import HorseAvatar from "../../components/HorseAvatar";
import { formatDayMonth } from "../../utils/date";

// Khối "VIỆC TIẾP THEO": 1 dòng lớn trong khung hairline nền be rất nhạt — giờ · loại việc (serif) · ngựa + chuồng ·
// nút "Xác nhận xong". task = null (hết việc) → câu chúc mừng. isBacklog: việc tồn → ghi thêm "Tồn từ dd/MM".
export default function NextTaskBanner({ task, gio, horse, horseName, stable, late, isBacklog, saving, onConfirm }) {
  return (
    <section aria-label="Việc tiếp theo">
      <h2 className="mb-2 text-xs font-medium tracking-wide text-stone uppercase">Việc tiếp theo</h2>
      <div className="rounded-md border border-stone/20 bg-[#faf7f1] px-4 py-3.5">
        {task ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className={`font-serif text-2xl font-semibold tabular-nums ${late || isBacklog ? "text-brass-deep" : "text-bark"}`}>{gio}</span>
            <span className="font-serif text-xl font-semibold text-ink">{task.LoaiViec}</span>
            <span className="flex min-w-0 items-center gap-2.5">
              <HorseAvatar horse={horse} size={40} />
              <span className="min-w-0">
                <span className="block font-serif text-base leading-tight font-semibold text-ink">{horseName}</span>
                <span className="block text-xs text-stone">
                  {stable && `Chuồng ${stable}`}
                  {isBacklog && <span className="text-brass-deep">{stable ? " · " : ""}Tồn từ {formatDayMonth(task.Ngay)}</span>}
                  {late && <span className="text-brass-deep">{stable || isBacklog ? " · " : ""}Trễ</span>}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => onConfirm(task)}
              disabled={saving}
              aria-label={`Xác nhận xong ${task.LoaiViec} cho ${horseName}`}
              className="ml-auto cursor-pointer rounded-sm border border-brass px-4 py-2 text-sm font-semibold whitespace-nowrap text-brass-deep transition-colors hover:bg-brass/10 disabled:cursor-wait disabled:opacity-60"
            >
              Xác nhận xong
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone">Hôm nay bạn đã hoàn thành mọi công việc.</p>
        )}
      </div>
    </section>
  );
}
