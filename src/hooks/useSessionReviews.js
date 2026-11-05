import { useEffect, useState } from "react";
import { getSessionReviewMap, subscribeSessionReviews } from "../services/sessionReviewMock";

// Báo cáo (Groom) và đánh giá (Trainer) của các buổi tập: map sessionId → bản ghi (MOCK — services/sessionReviewMock.js).
// Tự cập nhật khi có báo cáo / đánh giá mới.
export default function useSessionReviews() {
  const [records, setRecords] = useState({});

  useEffect(() => {
    let ignore = false;
    const load = () =>
      getSessionReviewMap().then((map) => {
        if (!ignore) setRecords(map);
      });
    load();
    const unsubscribe = subscribeSessionReviews(load);
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  return records;
}
