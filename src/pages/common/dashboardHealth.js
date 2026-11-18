import { getHorseAge } from "../../utils/date";

// Phân nhóm sức khỏe + nhóm lọc dùng chung cho trang Tổng quan của quản lý / bác sĩ / HLV trưởng.
export const HEALTH_BUCKETS = {
  FIT: "fit",
  WATCH: "watch",
  TREATING: "treating",
  CRITICAL: "critical",
};

export function classifyHealth(status, isLocked) {
  const s = (status ?? "Đủ điều kiện").trim();
  if (s === "Chấn thương" || s === "Cách ly") return HEALTH_BUCKETS.CRITICAL;
  if (s === "Đang điều trị" || isLocked) return HEALTH_BUCKETS.TREATING;
  if (s === "Cần theo dõi") return HEALTH_BUCKETS.WATCH;
  return HEALTH_BUCKETS.FIT;
}

export const BUCKET_META = {
  [HEALTH_BUCKETS.FIT]: {
    label: "Đủ điều kiện",
    badgeBg: "bg-[#eef4e8]",
    badgeText: "text-[#4d6b2a]",
    barColor: "bg-[#5f7d37]",
    dotColor: "bg-[#5f7d37]",
    priority: 3,
  },
  [HEALTH_BUCKETS.WATCH]: {
    label: "Cần theo dõi",
    badgeBg: "bg-[#fdf3e7]",
    badgeText: "text-[#c2570c]",
    barColor: "bg-[#d97724]",
    dotColor: "bg-[#d97724]",
    priority: 2,
  },
  [HEALTH_BUCKETS.TREATING]: {
    label: "Đang điều trị",
    badgeBg: "bg-[#fbeae8]",
    badgeText: "text-[#b3473f]",
    barColor: "bg-[#c25048]",
    dotColor: "bg-[#c25048]",
    priority: 1,
  },
  [HEALTH_BUCKETS.CRITICAL]: {
    label: "Chấn thương / Cách ly",
    badgeBg: "bg-[#f8d7da]",
    badgeText: "text-[#842029]",
    barColor: "bg-[#8f2d36]",
    dotColor: "bg-[#8f2d36]",
    priority: 0,
  },
};

export const FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "treating_all", label: "Đang điều trị & Khóa tập" },
  { key: HEALTH_BUCKETS.WATCH, label: "Cần theo dõi" },
  { key: HEALTH_BUCKETS.FIT, label: "Đủ điều kiện" },
];

export const isTreating = (h) =>
  h.bucket === HEALTH_BUCKETS.TREATING || h.bucket === HEALTH_BUCKETS.CRITICAL || Boolean(h.lock);

export const matchesTab = (h, key) => (key === "treating_all" ? isTreating(h) : key === "all" || h.bucket === key);

// Gộp ngựa + tình trạng sức khỏe + lệnh khóa; sắp theo mức ưu tiên rồi theo tên.
export function enrichHorses(horses, healthMap, lockMap) {
  return horses
    .map((horse) => {
      const health = healthMap[horse.HorseID];
      const lock = lockMap[horse.HorseID];
      const statusText = health?.TrangThai || "Đủ điều kiện";
      const bucket = classifyHealth(statusText, Boolean(lock));
      const age = getHorseAge(horse.NgaySinh) ?? horse.Tuoi ?? null;
      return { ...horse, statusText, updatedAt: health?.NgayCapNhat, lock, bucket, meta: BUCKET_META[bucket], age };
    })
    .sort((a, b) => a.meta.priority - b.meta.priority || a.Ten.localeCompare(b.Ten, "vi"));
}
