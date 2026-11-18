import { useEffect, useState } from "react";
import { getHealthStatuses } from "../services/horseService";
import { getActiveTrainingLocks } from "../services/vetService";

// Tình trạng ngựa để cân nhắc khi duyệt đăng ký thi đấu: tình trạng sức khỏe gần nhất + khóa tập đang hiệu lực (nếu có).
// Chỉ đọc; role nào chưa được phép gọi API đó thì phần tương ứng trả null (modal hiện "Chưa có thông tin") — không chặn việc duyệt.
export default function useHorseCondition(horseId) {
  const [state, setState] = useState({ horseId: null, health: null, lock: null, healthKnown: false, lockKnown: false });

  useEffect(() => {
    let ignore = false;
    const id = Number(horseId);
    Promise.allSettled([getHealthStatuses(), getActiveTrainingLocks()]).then(([health, locks]) => {
      if (ignore) return;
      setState({
        horseId: id,
        healthKnown: health.status === "fulfilled",
        health: health.status === "fulfilled" ? (health.value.find((h) => Number(h.HorseID) === id) ?? null) : null,
        lockKnown: locks.status === "fulfilled",
        lock: locks.status === "fulfilled" ? (locks.value.find((l) => Number(l.HorseID) === id) ?? null) : null,
      });
    });
    return () => {
      ignore = true;
    };
  }, [horseId]);

  return { ...state, loading: state.horseId !== Number(horseId) };
}
