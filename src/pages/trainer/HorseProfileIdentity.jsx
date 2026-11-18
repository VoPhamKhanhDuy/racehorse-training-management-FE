import TrainingLockNotice from "../../components/TrainingLockNotice";
import { formatBirthDateWithAge, formatDate, formatHorseAge } from "../../utils/date";
import { genderLabel } from "../../utils/horseGender";
import { getHealthLabel, getHealthStyle } from "../../utils/healthStatusStyles";

// HorseID → mã hồ sơ hiển thị: 1 → "NG-001"
const toProfileCode = (horseId) => `NG-${String(horseId).padStart(3, "0")}`;

// Nền ảnh chưa có: sọc chéo nhạt
const PLACEHOLDER_STYLE = {
  backgroundImage: "repeating-linear-gradient(135deg, #efe9dc 0 10px, #f6f1e7 10px 20px)",
};

// 1 ô nhãn–giá trị trong lưới thông tin chung: nhãn 13px #6b6055, giá trị 15px #2b2118
function Fact({ label, className = "", children }) {
  return (
    <div className={className}>
      <dt className="text-[13px] text-[#6b6055]">{label}</dt>
      <dd className="mt-0.5 text-[15px] break-words text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Đầu hồ sơ ngựa: khung ảnh 200px + tên + "Giống · tuổi · cân nặng" + tình trạng sức khỏe, rồi khung "Thông tin chung".
// health: bản ghi HEALTHSTATUS (có thể undefined); lock: TRAININGLOCK đang hiệu lực (có thể undefined).
export default function HorseProfileIdentity({ horse, ownerName, health, lock, lockedByName }) {
  const facts = [
    horse.Giong,
    formatHorseAge(horse.NgaySinh),
    horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`,
  ].filter(Boolean);
  // Dòng dõi dài thì trải 2 cột
  const longLineage = (horse.DongDoi ?? "").length > 28;

  return (
    <section aria-labelledby="horse-profile-name">
      <div className="flex flex-wrap gap-6 rounded border border-[#b9ab90] bg-white p-6">
        <span className="flex h-[200px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded bg-[#efe9dc]">
          {horse.photo ? (
            <img src={horse.photo} alt={`Ảnh ngựa ${horse.Ten}`} className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[13px] text-[#6b6055]" style={PLACEHOLDER_STYLE}>
              Chưa có ảnh
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h1 id="horse-profile-name" className="font-serif text-[30px] leading-tight font-semibold tracking-tight break-words text-[#2b2118]">
            {horse.Ten}
          </h1>
          <p className="mt-1 text-sm text-[#6b6055]">{facts.join(" · ")}</p>
          <p className="mt-3 text-sm">
            {health ? (
              <>
                <span className={`font-semibold ${getHealthStyle(health.TrangThai).text}`}>{getHealthLabel(health.TrangThai)}</span>
                {lock && <span className="font-semibold text-[#c0262d]"> · Đang khóa tập</span>}
                <span className="text-[13px] text-[#6b6055]"> · cập nhật {formatDate(health.NgayCapNhat)}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-[#6b6055]">{getHealthLabel(undefined)}</span>
                {lock && <span className="font-semibold text-[#c0262d]"> · Đang khóa tập</span>}
              </>
            )}
          </p>
        </div>
      </div>

      {lock && (
        <div className="mt-4">
          <TrainingLockNotice
            lock={lock}
            lockedByName={lockedByName}
            hint="Không xếp lịch, ghi nhận buổi tập hay đăng ký thi đấu cho đến khi bác sĩ thú y gỡ khóa."
          />
        </div>
      )}

      <div className="mt-6 rounded border border-[#d9cfba] bg-white px-6 py-5">
        <h2 className="font-serif text-[17px] font-semibold text-[#2b2118]">Thông tin chung</h2>
        {/* 8 ô nhãn–giá trị, lưới tự chia cột (≥220px): Mã hồ sơ, Giống, Giới tính, Ngày sinh, Màu lông, Cân nặng, Dòng dõi, Chủ ngựa */}
        <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-6 gap-y-4">
          <Fact label="Mã hồ sơ">
            <span className="tabular-nums">{toProfileCode(horse.HorseID)}</span>
          </Fact>
          <Fact label="Giống">{horse.Giong || "—"}</Fact>
          <Fact label="Giới tính">{genderLabel(horse.GioiTinh) || "—"}</Fact>
          <Fact label="Ngày sinh">
            <span className="tabular-nums">{formatBirthDateWithAge(horse.NgaySinh) || "—"}</span>
          </Fact>
          <Fact label="Màu lông">{horse.MauLong || "—"}</Fact>
          <Fact label="Cân nặng">{horse.CanNang ? `${horse.CanNang.toLocaleString("vi-VN")} kg` : "—"}</Fact>
          <Fact label="Dòng dõi" className={longLineage ? "min-[560px]:col-span-2" : ""}>
            {horse.DongDoi || "—"}
          </Fact>
          <Fact label="Chủ ngựa">{ownerName ?? "—"}</Fact>
        </dl>
      </div>
    </section>
  );
}
