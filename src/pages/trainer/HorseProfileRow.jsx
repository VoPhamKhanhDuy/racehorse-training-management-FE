import { Link } from "react-router-dom";
import { getHealthLabel } from "../../utils/healthStatusStyles";
import { formatHorseAge } from "../../utils/date";

// Vị trí cắt mặc định khi ảnh vào khung: ưu tiên thân ngựa; ngựa nào cần lệch khung thì khai photoPosition trong data/horses.js
const DEFAULT_PHOTO_POSITION = "center 30%";

// Màu chữ tình trạng sức khỏe trên thẻ (chỉ chữ, không nền): tốt olive, cần theo dõi nâu vàng, điều trị / chấn thương / cách ly đỏ
const HEALTH_TEXT = {
  "Tốt": "text-[#4d6b2a]",
  "Đủ điều kiện": "text-[#4d6b2a]",
  "Cần theo dõi": "text-[#946330]",
  "Đang điều trị": "text-[#c0262d]",
  "Chấn thương": "text-[#c0262d]",
  "Cách ly": "text-[#c0262d]",
};

// Nền ảnh chưa có: sọc chéo nhạt
const PLACEHOLDER_STYLE = {
  backgroundImage: "repeating-linear-gradient(135deg, #efe9dc 0 10px, #f6f1e7 10px 20px)",
};

// 1 thẻ ngựa trong lưới hồ sơ: ảnh trên cùng, tên + "Giống · tuổi · cân nặng", rồi các dòng nhãn–giá trị (sức khỏe, chủ ngựa).
// Cả thẻ là 1 link nên bấm chuột hoặc Tab + Enter đều mở hồ sơ.
// locked: ngựa đang khóa tập (ghi thêm "Đang khóa tập" sau tình trạng sức khỏe).
export default function HorseProfileRow({ horse, healthStatus, ownerName, locked }) {
  const facts = [
    horse.Giong,
    formatHorseAge(horse.NgaySinh),
    horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`,
  ].filter(Boolean);

  return (
    <Link
      to={`/trainer/horses/${horse.HorseID}`}
      className="group flex flex-col overflow-hidden rounded border border-[#d9cfba] bg-white outline-none transition-colors hover:border-[#b9ab90] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
    >
      <div className="h-[168px] w-full shrink-0 bg-[#efe9dc]">
        {horse.photo ? (
          <img
            src={horse.photo}
            alt={horse.Ten}
            className="h-full w-full object-cover"
            style={{ objectPosition: horse.photoPosition ?? DEFAULT_PHOTO_POSITION }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] text-[#6b6055]" style={PLACEHOLDER_STYLE}>
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate font-serif text-[19px] leading-snug font-semibold text-[#2b2118]">{horse.Ten}</h2>
        <p className="mt-0.5 truncate text-[13px] text-[#6b6055]">{facts.join(" · ")}</p>

        <dl className="mt-3 divide-y divide-[#ece5d6] border-t border-[#ece5d6] text-[13px]">
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="shrink-0 text-[#6b6055]">Sức khỏe</dt>
            <dd className="min-w-0 text-right font-semibold">
              <span className={HEALTH_TEXT[healthStatus] ?? "text-[#6b6055]"}>{getHealthLabel(healthStatus)}</span>
              {locked && <span className="text-[#c0262d]"> · Đang khóa tập</span>}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="shrink-0 text-[#6b6055]">Chủ ngựa</dt>
            <dd className="min-w-0 truncate text-right text-[#2b2118]">{ownerName ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
