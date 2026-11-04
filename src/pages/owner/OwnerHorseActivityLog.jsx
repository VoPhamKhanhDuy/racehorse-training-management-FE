import SectionTitle from "../../components/SectionTitle";
import styles from "./OwnerHorseCard.module.css";
import { formatDayMonth } from "../../utils/date";

const TYPE_LABELS = {
  TapLuyen: "Tập luyện",
  ThiDau: "Thi đấu",
  TiemPhong: "Tiêm phòng",
  KhamBenh: "Khám bệnh",
  KhoaTap: "Khóa tập",
};

export default function OwnerHorseActivityLog({ activities }) {
  const items = activities ?? [];

  return (
    <section aria-label="Nhật ký hoạt động" className={styles.activityLog}>
      <SectionTitle as="h3">Nhật ký hoạt động</SectionTitle>
      {items.length === 0 ? (
        <p className={styles.empty}>Chưa có hoạt động nào</p>
      ) : (
        <ul className={styles.activityList}>
          {items.map((item, index) => (
            <li key={`${item.Loai}-${item.Ngay}-${item.TieuDe}-${index}`} className={styles.activityRow}>
              <span className={styles.activityDate}>
                {!item.Ngay ? "—" : item.Ngay.includes("/") ? item.Ngay : formatDayMonth(item.Ngay)}
              </span>
              <span className={styles.activityType}>{TYPE_LABELS[item.Loai] ?? item.Loai}</span>
              <span className={styles.activityTitle} title={item.TieuDe}>
                {item.TieuDe}
              </span>
              {item.ChiTiet ? <span className={styles.activityDetail}>{item.ChiTiet}</span> : <span />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
