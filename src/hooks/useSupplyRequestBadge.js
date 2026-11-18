import { useEffect, useState } from "react";
import { REQUEST_STATUS, listSupplyRequests, subscribeSupplyRequests } from "../services/supplyRequestMock";

// Số yêu cầu bổ sung vật tư đang chờ xử lý → huy hiệu "Mới" ở menu "Quản lý vật tư" của Quản lý CLB. Role khác luôn trả 0.
export default function useSupplyRequestBadge(roleId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (roleId !== "club_manager") return undefined;
    let ignore = false;
    const refresh = async () => {
      const list = await listSupplyRequests();
      if (!ignore) setCount(list.filter((r) => r.status === REQUEST_STATUS.PENDING).length);
    };
    refresh();
    const unsubscribe = subscribeSupplyRequests(refresh);
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [roleId]);

  return count;
}
