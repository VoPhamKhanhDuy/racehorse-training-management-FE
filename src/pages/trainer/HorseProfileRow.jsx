import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";
import { getHealthLabel, getHealthStyle } from "../../utils/healthStatusStyles";

// Vị trí cắt mặc định khi ảnh vào khung vuông: ưu tiên thân ngựa; ngựa nào cần lệch khung thì khai photoPosition trong data/horses.js
const DEFAULT_PHOTO_POSITION = "center 30%";

// 1 dòng trong "sổ lý lịch" ngựa: ảnh | tên + giống/tuổi/cân nặng + dòng dõi | chỉ số tập gần nhất | chủ ngựa | sức khỏe.
// Cả dòng là 1 link nên bấm chuột hoặc Tab + Enter đều mở hồ sơ.
// Màn hẹp: ảnh nhỏ hơn, ẩn chủ ngựa; cột chỉ số tập chỉ hiện từ xl (đủ chỗ, không chen tên ngựa).
// latestIndex: ChiSoTap của buổi tập mới nhất (undefined = chưa có buổi tập)
export default function HorseProfileRow({ horse, healthStatus, ownerName, locked, latestIndex }) {
  const facts = [
    horse.Giong,
    horse.Tuoi && `${horse.Tuoi} tuổi`,
    horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`,
  ].filter(Boolean);

  return (
    <li className="border-b border-stone/15">
      <Link
        to={`/trainer/horses/${horse.HorseID}`}
        className="group flex min-h-[92px] items-center gap-3 py-2.5 outline-none transition-colors hover:bg-track/50 focus-visible:bg-track/50 sm:gap-5 sm:pr-2"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-stone/10 text-stone sm:h-[72px] sm:w-[72px]">
          {horse.photo ? (
            <img
              src={horse.photo}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: horse.photoPosition ?? DEFAULT_PHOTO_POSITION }}
            />
          ) : (
            <HorseIcon className="h-6 w-6" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-2xl leading-tight font-semibold text-bark">{horse.Ten}</span>
          {/* Màn hẹp: xuống dòng giữa các mục, không cắt đôi "500 kg" */}
          <span className="block text-sm text-stone sm:truncate">
            {facts.map((fact, i) => (
              // Dấu " · " nằm ngoài khối nowrap để trình duyệt được xuống dòng tại đó
              <Fragment key={fact}>
                {i > 0 && " · "}
                <span className="whitespace-nowrap">{fact}</span>
              </Fragment>
            ))}
          </span>
          {horse.DongDoi && (
            <span className="block truncate text-[15px]">
              <span className="text-stone">Dòng dõi: </span>
              <span className="font-serif text-bark/75 italic">{horse.DongDoi}</span>
            </span>
          )}
        </span>

        {/* Cách cột chủ ngựa ~48px (gap 20px + mr 28px). Ngựa đang khóa tập: vẫn hiện nhưng mờ nhẹ */}
        <span className={`mr-7 hidden w-[160px] shrink-0 xl:block ${locked ? "opacity-55" : ""}`}>
          <span className="block text-xs text-stone">Chỉ số tập gần nhất</span>
          {latestIndex === undefined ? (
            <span className="mt-1 block text-sm text-stone">Chưa có buổi tập</span>
          ) : (
            <span className="block whitespace-nowrap">
              <span className="font-serif text-[26px] leading-none font-semibold text-bark tabular-nums">{latestIndex}</span>
              <span className="text-xs text-stone">/100</span>
            </span>
          )}
        </span>

        <span className="hidden w-40 shrink-0 sm:block">
          <span className="block text-xs text-stone">Chủ ngựa</span>
          <span className="block truncate text-[15px] text-ink">{ownerName ?? "—"}</span>
        </span>

        <span className="min-w-24 shrink-0 whitespace-nowrap sm:w-28">
          <span className="block text-xs text-stone">Sức khỏe</span>
          <span className={`block text-base ${getHealthStyle(healthStatus).text}`}>{getHealthLabel(healthStatus)}</span>
          {locked && <span className="block text-xs text-stone">Đang khóa tập</span>}
        </span>

        {/* Chevron chỉ hiện khi hover/focus; luôn giữ chỗ để dòng không bị xô lệch */}
        <ChevronRight
          className="hidden h-4 w-4 shrink-0 text-stone opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
