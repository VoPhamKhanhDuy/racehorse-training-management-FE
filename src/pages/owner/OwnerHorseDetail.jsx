import OwnerDottedRow from "./OwnerDottedRow";
import OwnerHorseAchievements from "./OwnerHorseAchievements";
import styles from "./OwnerHorseCard.module.css";
import { FEED_COMPONENTS, FEED_MEALS } from "../../data/feedingOptions";
import { formatBirthDateWithAge, formatHorseAge } from "../../utils/date";
import { OWNER_HEALTH_COLORS } from "../../utils/ownerHealthText";

// Dòng sức khỏe cho chủ ngựa: chữ thường đậm 600, chỉ cụm trạng thái có màu (không pill/chấm/nền).
// lead: chữ đứng trước; word: cụm tô màu. Trạng thái khác / chưa cập nhật → chữ nhạt.
const HEALTH_LINES = {
  "Tốt": { lead: "Sức khỏe ", word: "tốt", color: OWNER_HEALTH_COLORS["Tốt"] },
  "Cần theo dõi": { lead: "Sức khỏe ", word: "cần theo dõi", color: OWNER_HEALTH_COLORS["Cần theo dõi"] },
  "Đang điều trị": { lead: "Sức khỏe ", word: "đang điều trị", color: OWNER_HEALTH_COLORS["Đang điều trị"] },
};

// Dấu phẩy thập phân, tối đa 1 chữ số (vd 2,5)
const formatNumber = (value) => (Math.round(value * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Khẩu phần (FEEDINGPLAN): mỗi bữa 1 dòng "2,5 kg ngũ cốc · 3 kg cỏ · 20 g vitamin · Sáng" (đơn vị theo feedingOptions,
// bỏ thành phần = 0); bữa theo thứ tự trong ngày. Không có bữa nào → "" (hiện "Chưa có").
function formatFeeding(feeding) {
  return FEED_MEALS.map((meal) => feeding.find((f) => f.Bua === meal))
    .filter(Boolean)
    .map((plan) => {
      const parts = FEED_COMPONENTS.filter((c) => Number(plan[c.field]) > 0).map(
        (c) => `${formatNumber(Number(plan[c.field]))} ${c.unit} ${c.label.toLocaleLowerCase("vi")}`
      );
      return [...parts, plan.Bua].join(" · ");
    })
    .join("\n");
}

// Trang chi tiết ngựa của chủ ngựa (chỉ xem) — 1 lưới 2 cột thống nhất (OwnerHorseCard.module.css: 440px | còn lại):
// Hàng 1: ảnh 440×330 | "DÒNG DÕI · …", tên, "Giống · tuổi", dòng sức khỏe, "Đang tạm ngưng huấn luyện" nếu đang khóa tập
// (KHÔNG hiện lý do). Hairline. Hàng 2: Hồ sơ + Chăm sóc hằng ngày | Thành tích thi đấu.
// Màn hẹp (< 900px): 1 cột theo thứ tự nhận diện → Hồ sơ → Chăm sóc → Thành tích.
// care: { stable, feeding } từ getHorseDailyCare.
export default function OwnerHorseDetail({ horse, health, locked, care, achievements }) {
  const subtitle = [horse.Giong, formatHorseAge(horse.NgaySinh)].filter(Boolean).join(" · ");
  const healthLine = HEALTH_LINES[health?.TrangThai];

  return (
    <article aria-label={`Hồ sơ ${horse.Ten}`} className={styles.page}>
      {/* Hàng 1 — nhận diện */}
      <div className={styles.grid}>
        <div className={styles.photo}>
          {horse.photo ? (
            <img src={horse.photo} alt={`Ảnh ngựa ${horse.Ten}`} style={{ objectPosition: horse.photoPosition ?? "center 30%" }} />
          ) : (
            <span aria-hidden="true" className={styles.photoInitial}>
              {horse.Ten.charAt(0).toLocaleUpperCase("vi")}
            </span>
          )}
        </div>

        <div className={styles.identity}>
          {horse.DongDoi && <p className={styles.eyebrow}>Dòng dõi · {horse.DongDoi}</p>}
          <h2 className={styles.name}>{horse.Ten}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <p className={styles.health}>
            {healthLine ? (
              <>
                <span className="text-ink">{healthLine.lead}</span>
                <span style={{ color: healthLine.color }}>{healthLine.word}</span>
              </>
            ) : (
              <span className="font-normal text-stone">Sức khỏe: {health?.TrangThai ?? "chưa cập nhật"}</span>
            )}
          </p>
          {locked && <p className={styles.lock}>Đang tạm ngưng huấn luyện</p>}
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Hàng 2 — dữ liệu */}
      <div className={styles.grid}>
        <div className={styles.column}>
          <section aria-label="Hồ sơ">
            <h3 className={styles.eyebrow}>Hồ sơ</h3>
            <dl className={styles.specs}>
              <OwnerDottedRow label="Giống" value={horse.Giong} />
              <OwnerDottedRow label="Giới tính" value={horse.GioiTinh} />
              <OwnerDottedRow label="Màu lông" value={horse.MauLong} />
              <OwnerDottedRow label="Ngày sinh" value={formatBirthDateWithAge(horse.NgaySinh)} />
              <OwnerDottedRow label="Cân nặng" value={horse.CanNang ? `${horse.CanNang.toLocaleString("vi-VN")} kg` : ""} />
            </dl>
          </section>

          <section aria-label="Chăm sóc hằng ngày" className={styles.sectionGap}>
            <h3 className={styles.eyebrow}>Chăm sóc hằng ngày</h3>
            <dl className={styles.specs}>
              <OwnerDottedRow label="Số chuồng" value={care.stable?.SoChuong} />
              <OwnerDottedRow label="Lịch sinh hoạt" value={care.stable?.LichSinhHoat} stacked />
              <OwnerDottedRow label="Khẩu phần" value={formatFeeding(care.feeding)} stacked />
            </dl>
          </section>
        </div>

        <div className={styles.column}>
          <OwnerHorseAchievements achievements={achievements} />
        </div>
      </div>
    </article>
  );
}
