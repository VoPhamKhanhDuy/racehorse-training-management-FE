import SectionTitle from "../../components/SectionTitle";
import OwnerDottedRow from "./OwnerDottedRow";
import OwnerHorseAchievements from "./OwnerHorseAchievements";
import styles from "./OwnerHorseCard.module.css";
import { FEED_COMPONENTS, FEED_MEALS } from "../../data/feedingOptions";
import { formatBirthDateWithAge } from "../../utils/date";
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

// Trang chi tiết ngựa của chủ ngựa (chỉ xem) — bố cục trong OwnerHorseCard.module.css:
// Phần đầu 2 cột: ảnh (4:3, tối đa 620px) | "DÒNG DÕI · …", tên 56px, dòng sức khỏe, "Đang tạm ngưng huấn luyện" nếu đang khóa
// tập (KHÔNG hiện lý do), rồi bảng "Hồ sơ" đường chấm; cột phải căn đỉnh theo đỉnh ảnh.
// Bên dưới: "Chăm sóc hằng ngày" | "Thành tích thi đấu" cạnh nhau (≥ 1100px) hoặc xếp dọc full-width.
// care: { stable, feeding } từ getHorseDailyCare.
export default function OwnerHorseDetail({ horse, health, locked, care, achievements }) {
  const healthLine = HEALTH_LINES[health?.TrangThai];

  return (
    <article aria-label={`Hồ sơ ${horse.Ten}`} className={styles.page}>
      <div className={styles.top}>
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

          <section aria-label="Hồ sơ" className={styles.profile}>
            <SectionTitle as="h3">Hồ sơ</SectionTitle>
            <dl className={styles.specs}>
              <OwnerDottedRow label="Giống" value={horse.Giong} />
              <OwnerDottedRow label="Giới tính" value={horse.GioiTinh} />
              <OwnerDottedRow label="Màu lông" value={horse.MauLong} />
              <OwnerDottedRow
                label="Ngày sinh"
                value={
                  horse.NgaySinh?.includes("/")
                    ? horse.NgaySinh
                    : formatBirthDateWithAge(horse.NgaySinh)
                }
              />
              <OwnerDottedRow label="Cân nặng" value={horse.CanNang ? `${horse.CanNang.toLocaleString("vi-VN")} kg` : ""} />
            </dl>
          </section>
        </div>
      </div>

      <div className={styles.lower}>
        <section aria-label="Chăm sóc hằng ngày">
          <SectionTitle as="h3">Chăm sóc hằng ngày</SectionTitle>
          <dl className={styles.specs}>
            <OwnerDottedRow label="Số chuồng" value={care.stable?.SoChuong || "—"} />
            <OwnerDottedRow
              label="Lịch sinh hoạt"
              value={care.stable?.LichSinhHoat || "Chưa có lịch sinh hoạt."}
              stacked
            />
            <OwnerDottedRow
              label="Khẩu phần"
              value={care.dietText || (care.feeding?.length ? formatFeeding(care.feeding) : "Chưa có khẩu phần.")}
              stacked
            />
          </dl>
        </section>

        <OwnerHorseAchievements achievements={achievements} />
      </div>
    </article>
  );
}
