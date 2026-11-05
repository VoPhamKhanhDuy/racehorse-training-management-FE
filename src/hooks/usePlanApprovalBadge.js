import { useEffect, useState } from "react";
import { getOwnerHorses } from "../services/ownerService";
import { countUnreadNotices, subscribePlanApprovals } from "../services/planApprovalMock";

// Số thông báo duyệt kế hoạch chưa đọc → huy hiệu "Mới" ở menu (Trainer: Giáo án tập luyện, Chủ ngựa: Lịch trình).
// Role khác luôn trả 0. Tự cập nhật khi trạng thái duyệt đổi.
export default function usePlanApprovalBadge(roleId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (roleId !== "head_trainer" && roleId !== "horse_owner") return undefined;
    let ignore = false;
    let horseIds = null;

    const refresh = () => {
      if (!ignore) setCount(countUnreadNotices(roleId, horseIds));
    };

    const start = async () => {
      if (roleId === "horse_owner") {
        try {
          horseIds = (await getOwnerHorses()).map((h) => h.HorseID);
        } catch {
          horseIds = [];
        }
      }
      refresh();
    };
    start();

    const unsubscribe = subscribePlanApprovals(refresh);
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [roleId]);

  return count;
}
