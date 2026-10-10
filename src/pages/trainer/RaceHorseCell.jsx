import HorseIcon from "../../components/HorseIcon";
import { formatDayMonth } from "../../utils/date";

const NOTE_BROWN = "text-[#946330]";
// Cột dính cần nền đặc: hàng bị chặn = stone 5% trên trắng; hàng đang rê chuột = be rất nhạt
const BG_BLOCKED = "bg-[color-mix(in_srgb,var(--color-stone)_5%,white)]";
const BG_HOVER_ROW = "bg-[#faf7f1]";

// Ô đầu hàng (dính trái khi cuộn ngang): ảnh tròn + tên + "Giống · tuổi".
// Dòng thứ ba chỉ hiện khi bất thường: khóa tập / đang điều trị (xám, cả hàng mờ) | "Sức khỏe: …" (nâu).
// Buổi tập gần nhất: xem bằng title khi rê chuột vào tên. Điện thoại: chỉ còn ảnh + tên rút gọn.
export default function RaceHorseCell({ horse, info, highlighted }) {
  const { blockReason, health, lastSession, trainedRecently } = info;
  const needsWatch = !blockReason && health && health !== "Tốt";
  const trainingHint = !trainedRecently
    ? "Chưa tập 14 ngày gần đây"
    : `Buổi tập gần nhất ${formatDayMonth(lastSession)}`;

  return (
    <th
      scope="row"
      className={`sticky left-0 z-10 border-r border-b border-stone/10 border-r-stone/15 p-2 text-left font-normal sm:p-3 ${
        highlighted ? BG_HOVER_ROW : blockReason ? BG_BLOCKED : "bg-white"
      }`}
    >
      <div className={`flex items-center gap-2 sm:gap-3 ${blockReason ? "opacity-55" : ""}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone sm:h-9 sm:w-9">
          {horse.photo ? (
            <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <HorseIcon className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p title={trainingHint} className="truncate font-serif text-sm leading-tight font-semibold text-ink sm:text-[17px]">
            {horse.Ten}
          </p>
          <p className="hidden truncate text-xs text-stone sm:block">
            {[horse.Giong, horse.Tuoi && `${horse.Tuoi} tuổi`].filter(Boolean).join(" · ")}
          </p>
          {(blockReason || needsWatch) && (
            <p className={`hidden truncate text-xs sm:block ${blockReason ? "text-stone" : NOTE_BROWN}`}>
              {blockReason ?? `Sức khỏe: ${health}`}
            </p>
          )}
        </div>
      </div>
    </th>
  );
}
