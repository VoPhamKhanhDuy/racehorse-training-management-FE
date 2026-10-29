import { useEffect, useRef, useState } from "react";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import StableDetail from "./StableDetail";
import StableFloorPlan from "./StableFloorPlan";
import { getCareTasks, getFeedingPlans, getHorses, getStableAssignments } from "../../services/careService";
import { CARE_WORK_WINDOW, getTaskTime, toMinutes } from "../../config/careTaskSchedule";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const NARROW_QUERY = "(max-width: 899px)";

// "Chuồng trại" của nhân viên chăm sóc (chỉ xem): mặt bằng chuồng (STABLEASSIGNMENT) bên trái, chi tiết chuồng đang chọn
// (lịch sinh hoạt + khẩu phần FEEDINGPLAN) bên phải. Ngựa "bạn phụ trách" suy ra từ CARETASK của chính nhân viên.
export default function StableMap() {
  const { user } = useAuth();
  const groomId = toUserID(user.id);
  const detailRef = useRef(null);

  const [assignments, setAssignments] = useState([]);
  const [horses, setHorses] = useState([]);
  const [feeding, setFeeding] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState(null); // StableID do người dùng chọn

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock careService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getStableAssignments(), getHorses(), getFeedingPlans(), getCareTasks(groomId)]).then(
      ([stableList, horseList, feedList, taskList]) => {
        if (ignore) return;
        setAssignments(stableList);
        setHorses(horseList);
        setFeeding(feedList);
        setMyTasks(taskList);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [groomId]);

  // Ngựa bạn phụ trách = có CARETASK của bạn; trạng thái việc hôm nay theo từng ngựa (việc tiếp theo = chưa xong, giờ sớm nhất)
  const myHorseIds = new Set(myTasks.map((t) => t.HorseID));
  const today = todayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const inWorkWindow = nowMin >= toMinutes(CARE_WORK_WINDOW.tu) && nowMin <= toMinutes(CARE_WORK_WINDOW.den);
  const statusByHorse = {};
  myHorseIds.forEach((horseId) => {
    const todays = myTasks.filter((t) => t.HorseID === horseId && t.Ngay === today);
    const pendingTasks = todays.filter((t) => !t.TrangThai);
    const nextTime = pendingTasks.map((t) => getTaskTime(t.LoaiViec)).filter(Boolean).sort()[0] ?? "";
    statusByHorse[horseId] = {
      pending: pendingTasks.length,
      nextTime,
      late: Boolean(nextTime) && inWorkWindow && toMinutes(nextTime) < nowMin,
    };
  });

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const bySoChuong = (a, b) => a.SoChuong.localeCompare(b.SoChuong, "vi", { numeric: true });
  const sorted = [...assignments].sort(bySoChuong);
  // Mặc định: chuồng đầu tiên của nhân viên; không có thì chuồng đầu tiên
  const defaultStable = sorted.find((s) => myHorseIds.has(s.HorseID)) ?? sorted[0];
  const selected = sorted.find((s) => s.StableID === pickedId) ?? defaultStable;

  const handleSelect = (stableId) => {
    setPickedId(stableId);
    // Màn hẹp: chi tiết nằm dưới sơ đồ → cuộn tới để thấy ngay
    if (window.matchMedia(NARROW_QUERY).matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  };

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Chuồng trại</h1>

      {loading ? (
        <LoadingState />
      ) : assignments.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Chưa có chuồng nào được phân.</p>
      ) : (
        <div className="mt-5 grid items-start gap-8 min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[900px]:gap-10">
          <section aria-label="Sơ đồ chuồng" className="min-w-0">
            <h2 className="mb-2 text-[11px] font-medium tracking-wide text-stone uppercase">Sơ đồ chuồng</h2>
            <StableFloorPlan
              assignments={assignments}
              horseById={horseById}
              myHorseIds={myHorseIds}
              statusByHorse={statusByHorse}
              selectedId={selected?.StableID}
              onSelect={handleSelect}
            />
          </section>

          <section ref={detailRef} aria-label="Chi tiết chuồng" className="min-w-0 min-[900px]:sticky min-[900px]:top-6">
            {selected && (
              <StableDetail
                stable={selected}
                horse={horseById[selected.HorseID]}
                feeding={feeding.filter((f) => f.HorseID === selected.HorseID)}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
