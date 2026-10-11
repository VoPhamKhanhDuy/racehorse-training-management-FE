import HorseIcon from "../../components/HorseIcon";
import TrainingLockNotice from "./TrainingLockNotice";
import { formatBirthDateWithAge } from "../../utils/date";

// HorseID → mã hồ sơ hiển thị: 1 → "NG-001"
const toProfileCode = (horseId) => `NG-${String(horseId).padStart(3, "0")}`;

// 1 ô nhãn–giá trị trong lưới lý lịch; hairline phía trên mỗi ô tạo vạch ngăn giữa các hàng
function Fact({ label, className = "", children }) {
  return (
    <div className={`border-t border-stone/15 py-2.5 ${className}`}>
      <dt className="text-xs tracking-wide text-stone uppercase">{label}</dt>
      <dd className="mt-0.5 text-[17px] break-words text-ink">{children}</dd>
    </div>
  );
}

// Khối "Lý lịch" đầu hồ sơ ngựa: ảnh 200px + tên lớn + lưới nhãn–giá trị 2 cột.
// lock: TRAININGLOCK đang hiệu lực (có thể undefined).
export default function HorseProfileIdentity({ horse, ownerName, lock, lockedByName }) {
  return (
    <section aria-labelledby="horse-profile-name">
      <h2 className="font-serif text-xl font-semibold text-ink">Lý lịch</h2>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        <span className="flex h-[200px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-stone/10 text-stone">
          {horse.photo ? (
            <img src={horse.photo} alt={`Ảnh ngựa ${horse.Ten}`} className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <HorseIcon className="h-12 w-12" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h1 id="horse-profile-name" className="mb-3 font-serif text-[40px] leading-tight font-semibold tracking-tight break-words text-bark">
            {horse.Ten}
          </h1>
          {/* 8 ô, 2 cột: Mã hồ sơ | Giống; Giới tính | Ngày sinh; Màu lông | Cân nặng; Dòng dõi | Chủ ngựa.
              Tên chỉ hiện 1 lần ở tiêu đề lớn phía trên; sức khỏe nằm ở mục "Sức khỏe" bên dưới */}
          <dl className="grid grid-cols-2 gap-x-6 sm:gap-x-8">
            <Fact label="Mã hồ sơ">
              <span className="tabular-nums">{toProfileCode(horse.HorseID)}</span>
            </Fact>
            <Fact label="Giống">{horse.Giong || "—"}</Fact>
            <Fact label="Giới tính">{horse.GioiTinh || "—"}</Fact>
            <Fact label="Ngày sinh">
              <span className="tabular-nums">{formatBirthDateWithAge(horse.NgaySinh) || "—"}</span>
            </Fact>
            <Fact label="Màu lông">{horse.MauLong || "—"}</Fact>
            <Fact label="Cân nặng">{horse.CanNang ? `${horse.CanNang.toLocaleString("vi-VN")} kg` : "—"}</Fact>
            <Fact label="Dòng dõi">
              {horse.DongDoi ? <span className="font-serif italic">{horse.DongDoi}</span> : "—"}
            </Fact>
            <Fact label="Chủ ngựa">{ownerName ?? "—"}</Fact>
          </dl>
        </div>
      </div>

      {lock && (
        <div className="mt-5">
          <TrainingLockNotice
            lock={lock}
            lockedByName={lockedByName}
            hint="Không xếp lịch, ghi nhận buổi tập hay đăng ký thi đấu cho đến khi bác sĩ thú y gỡ khóa."
          />
        </div>
      )}
    </section>
  );
}
