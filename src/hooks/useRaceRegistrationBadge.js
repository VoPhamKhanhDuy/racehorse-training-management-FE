import { useEffect, useState } from "react";
import { getOwnerHorses } from "../services/ownerService";
import { countRaceRegistrationsWaiting, subscribeRaceRegistrations } from "../services/raceRegistrationMock";

// Số đăng ký thi đấu cần chú ý → huy hiệu "Mới" ở menu: Chủ ngựa (Thi đấu) / Quản lý (Đăng ký thi đấu) = đang chờ mình duyệt;
// Trainer (Đăng ký thi đấu) = đăng ký của mình vừa được duyệt hoặc bị từ chối mà chưa xem.
// Role khác luôn trả 0. Tự cập nhật khi đăng ký đổi.
export default function useRaceRegistrationBadge(roleId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (roleId !== "horse_owner" && roleId !== "club_manager" && roleId !== "head_trainer") return undefined;
    let ignore = false;
    let horseIds = [];

    const refresh = async () => {
      const next = await countRaceRegistrationsWaiting(roleId, { horseIds });
      if (!ignore) setCount(next);
    };

    (async () => {
      if (roleId === "horse_owner") {
        try {
          horseIds = (await getOwnerHorses()).map((h) => h.HorseID);
        } catch {
          horseIds = [];
        }
      }
      refresh();
    })();

    const unsubscribe = subscribeRaceRegistrations(refresh);
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [roleId]);

  return count;
}
