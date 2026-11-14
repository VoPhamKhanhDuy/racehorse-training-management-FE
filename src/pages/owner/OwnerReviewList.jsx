import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import { formatDate, formatDayMonth } from "../../utils/date";
import { assessmentLabel } from "../../utils/sessionReview";

// "Nhận xét gần đây" của Chủ ngựa: danh sách gọn, mỗi mục 3 dòng — "Ngựa · dd/MM" + "Điểm x/10 · Nhận định" (chữ trung tính, chỉ "Cần chú ý"
// có chấm cam); nhận xét (tối đa 2 dòng, cắt "…", bấm mở khung đọc đầy đủ); "Huấn luyện viên <tên>". Không kẻ ngang, cách nhau 14px.
// reviews: đánh giá HLV ĐÃ GỬI cho chủ ngựa (không có báo cáo thô của Groom). Chỉ đọc.
export default function OwnerReviewList({ reviews }) {
  const [open, setOpen] = useState(null);

  if (reviews.length === 0) return <p className="text-sm text-[#4a3f33]">Chưa có nhận xét</p>;

  const scoreLine = (review) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {review.assessment === "Attention" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />}
      Điểm {review.score}/10 · {assessmentLabel(review.assessment)}
    </span>
  );

  const header = open && (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{open.horseName}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {formatDate(open.date)}
        {open.sessionTitle && <> · {open.sessionTitle}</>}
      </p>
    </div>
  );

  return (
    <>
      <ul className="space-y-[14px]">
        {reviews.map((review) => (
          <li key={review.sessionId}>
            <div className="flex items-baseline justify-between gap-3 text-sm text-[#1f1f1f]">
              <span className="min-w-0 truncate">
                <b className="font-semibold">{review.horseName}</b> · {formatDayMonth(review.date)}
                {review.sessionTitle && <> · {review.sessionTitle}</>}
              </span>
              {scoreLine(review)}
            </div>
            <button
              type="button"
              onClick={() => setOpen(review)}
              title="Bấm để đọc đầy đủ"
              className="mt-1 line-clamp-2 w-full cursor-pointer text-left text-sm leading-[1.5] text-[#1f1f1f] hover:underline"
            >
              {review.comment}
            </button>
            <p className="mt-0.5 text-xs text-[#6b6b6b]">Huấn luyện viên {review.trainerName}</p>
          </li>
        ))}
      </ul>

      {open && (
        <CenterDialog
          label={`Nhận xét ${open.horseName}`}
          header={header}
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50"
              >
                Đóng
              </button>
            </div>
          }
          onClose={() => setOpen(null)}
        >
          <p className="text-sm font-medium text-[#1f1f1f]">{scoreLine(open)}</p>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-[#1f1f1f]">{open.comment}</p>
          <p className="mt-4 text-[13px] text-[#6b6b6b]">Huấn luyện viên {open.trainerName}</p>
        </CenterDialog>
      )}
    </>
  );
}
