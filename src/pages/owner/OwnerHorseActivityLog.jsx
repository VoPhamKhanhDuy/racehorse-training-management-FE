import { useState } from "react";
import SectionTitle from "../../components/SectionTitle";
import styles from "./OwnerHorseCard.module.css";
import { formatDayMonth } from "../../utils/date";
import { assessmentLabel } from "../../utils/sessionReview";

const TYPE_LABELS = {
  TapLuyen: "Tập luyện",
  ThiDau: "Thi đấu",
  TiemPhong: "Tiêm phòng",
  KhamBenh: "Khám bệnh",
  KhoaTap: "Khóa tập",
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const DAY_MONTH_YEAR = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DAY_MONTH = /^(\d{2})\/(\d{2})$/;

// Ngày của dòng nhật ký (ISO, dd/MM/yyyy hoặc dd/MM) → khóa "yyyy-MM-dd" để so sánh; không đọc được → ""
function dateKey(ngay) {
  if (!ngay) return "";
  const iso = ISO_DATE.exec(ngay);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = DAY_MONTH_YEAR.exec(ngay);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const dm = DAY_MONTH.exec(ngay);
  if (dm) return `${new Date().getFullYear()}-${dm[2]}-${dm[1]}`;
  return "";
}

// Trùng ngày với buổi (dd/MM không có năm thì chỉ so ngày + tháng)
function sameDay(ngay, isoDate) {
  if (DAY_MONTH.test(ngay ?? "")) return ngay === formatDayMonth(isoDate);
  return dateKey(ngay) === isoDate;
}

// Ghép đánh giá ĐÃ GỬI vào nhật ký (cùng nguồn getOwnerSessionReviews với "Nhận xét gần đây"):
// - dòng "Tập luyện" cùng ngày và tên khớp buổi → gắn đánh giá;
// - chưa có dòng → thêm dòng mới, đặt đúng chỗ theo ngày (giữ chiều sắp xếp của danh sách, mặc định mới nhất trước).
// Trả về danh sách dòng; dòng có .review thì mở được.
function mergeSentReviews(activities, reviews) {
  const rows = activities.map((item) => ({ ...item, review: null }));
  const keys = rows.map((r) => dateKey(r.Ngay)).filter(Boolean);
  const ascending = keys.length > 1 && keys[0] < keys[keys.length - 1];

  reviews.forEach((review) => {
    const title = (review.sessionTitle ?? "").toLowerCase();
    const match = rows.findIndex(
      (r) =>
        !r.review &&
        r.Loai === "TapLuyen" &&
        sameDay(r.Ngay, review.date) &&
        (!title || (r.TieuDe ?? "").toLowerCase().includes(title))
    );
    if (match >= 0) {
      rows[match].review = review;
      return;
    }
    const row = {
      Ngay: review.date,
      Loai: "TapLuyen",
      TieuDe: `${review.sessionTitle || "Buổi tập"} - ${review.horseName}`,
      ChiTiet: null,
      review,
    };
    let at = rows.findIndex((r) => {
      const key = dateKey(r.Ngay);
      return key && (ascending ? key > review.date : key < review.date);
    });
    if (at < 0) at = rows.length;
    rows.splice(at, 0, row);
  });
  return rows;
}

// Nhật ký hoạt động của ngựa (chủ ngựa chỉ xem). reviews: đánh giá đã gửi của ngựa này.
// Dòng "Tập luyện" của buổi đã gửi: cột phải là điểm ("8/10"), bấm mở nhận định, nhận xét, HLV, ngày gửi; bấm lần nữa thu lại.
export default function OwnerHorseActivityLog({ activities, reviews = [] }) {
  const [expanded, setExpanded] = useState({}); // sessionId → true
  const items = mergeSentReviews(activities ?? [], reviews);

  const toggle = (sessionId) => setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));

  return (
    <section aria-label="Nhật ký hoạt động" className={styles.activityLog}>
      <SectionTitle as="h3">Nhật ký hoạt động</SectionTitle>
      {items.length === 0 ? (
        <p className={styles.empty}>Chưa có hoạt động nào</p>
      ) : (
        <ul className={styles.activityList}>
          {items.map((item, index) => {
            const review = item.review;
            const open = review ? Boolean(expanded[review.sessionId]) : false;
            const interactive = review
              ? {
                  role: "button",
                  tabIndex: 0,
                  "aria-expanded": open,
                  onClick: () => toggle(review.sessionId),
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(review.sessionId);
                    }
                  },
                  style: { cursor: "pointer" },
                }
              : {};
            return (
              <li
                key={`${item.Loai}-${item.Ngay}-${item.TieuDe}-${index}`}
                className={styles.activityRow}
                {...interactive}
              >
                <span className={styles.activityDate}>
                  {!item.Ngay ? "—" : item.Ngay.includes("/") ? item.Ngay : formatDayMonth(item.Ngay)}
                </span>
                <span className={styles.activityType}>{TYPE_LABELS[item.Loai] ?? item.Loai}</span>
                <span className={styles.activityTitle} title={item.TieuDe}>
                  {item.TieuDe}
                </span>
                {review ? (
                  <span className={styles.activityDetail}>{review.score}/10</span>
                ) : item.ChiTiet ? (
                  <span className={styles.activityDetail}>{item.ChiTiet}</span>
                ) : (
                  <span />
                )}
                {review && open && (
                  <div style={{ gridColumn: "1 / -1" }} className="mt-2 text-sm text-[#1f1f1f]">
                    <p className="font-semibold">{assessmentLabel(review.assessment)}</p>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">{review.comment}</p>
                    <p className="mt-2 text-xs text-[#6b6b6b]">
                      Huấn luyện viên {review.trainerName}
                      {review.sentAt && <> · gửi {new Date(review.sentAt).toLocaleDateString("vi-VN")}</>}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
