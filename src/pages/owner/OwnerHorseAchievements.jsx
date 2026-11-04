import SectionTitle from "../../components/SectionTitle";
import styles from "./OwnerHorseCard.module.css";
import { formatDayMonth } from "../../utils/date";
import { formatRank } from "../../utils/raceResult";

const RANK_WORDS = { 1: "Nhất", 2: "Nhì", 3: "Ba" };

// 1 → "Nhất", 2 → "Nhì", 3 → "Ba", 4 → "Hạng 4"
const rankWord = (rank) => RANK_WORDS[rank] ?? formatRank(rank);

// Kết quả khi chưa có thứ hạng (chữ nhạt, nghiêng)
const STATE_TEXT = { upcoming: "Sắp diễn ra", pending: "Chưa có kết quả", unranked: "Không xếp hạng" };

// "Thành tích thi đấu" của chủ ngựa (chỉ xem). achievements: getHorseAchievements(...) — đã sắp ngày giảm dần.
// Mỗi giải đúng 1 hàng (grid 56px | 1fr | auto, không xuống dòng): ngày "DD/MM" | tên giải (cắt "…" nếu dài) | kết quả canh phải.
export default function OwnerHorseAchievements({ achievements }) {
  const { entries } = achievements;

  return (
    <section aria-label="Thành tích thi đấu" className={styles.achievements}>
      <SectionTitle as="h3">Thành tích thi đấu</SectionTitle>
      {entries.length === 0 ? (
        <p className={styles.empty}>Chưa tham gia giải nào</p>
      ) : (
        <ul className={styles.raceList}>
          {entries.map(({ race, registration, state, resultLabel }) => (
            <li key={race.RaceID} className={styles.raceRow}>
              <span className={styles.raceDate}>{race.Ngay?.includes("/") ? race.Ngay : formatDayMonth(race.Ngay)}</span>
              <span className={styles.raceName} title={race.TenGiai}>
                {race.TenGiai}
              </span>
              {state === "ranked" && registration.ThuHang ? (
                <span className={`${styles.raceRank} ${registration.ThuHang === 1 ? styles.raceRankFirst : ""}`}>
                  {rankWord(registration.ThuHang)}
                </span>
              ) : (
                <span className={styles.raceState}>{resultLabel ?? STATE_TEXT[state]}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
