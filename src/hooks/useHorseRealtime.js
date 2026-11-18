import { useEffect, useRef } from "react";
import useAuth from "./useAuth";
import { connectHorseActivityHub } from "../services/horseRealtime";
import { getApiToken } from "../services/apiSession";

/**
 * Chủ ngựa: lắng nghe horseChanged từ SignalR rồi gọi onHorseChanged({ horseId, kind }).
 * horseIdFilter: chỉ phản hồi đúng 1 ngựa (trang chi tiết); bỏ trống = mọi ngựa của owner.
 */
export default function useHorseRealtime(onHorseChanged, { horseIdFilter } = {}) {
  const { user } = useAuth();
  const callbackRef = useRef(onHorseChanged);
  callbackRef.current = onHorseChanged;
  const filterRef = useRef(horseIdFilter);
  filterRef.current = horseIdFilter;

  useEffect(() => {
    if (user?.roleId !== "horse_owner") return undefined;
    if (!getApiToken()) return undefined;

    const handle = connectHorseActivityHub({
      onHorseChanged: (event) => {
        const filter = filterRef.current;
        if (filter != null && Number(filter) !== Number(event.horseId)) return;
        callbackRef.current?.(event);
      },
    });

    return () => {
      handle.stop();
    };
  }, [user?.roleId, user?.apiUserId]);
}
