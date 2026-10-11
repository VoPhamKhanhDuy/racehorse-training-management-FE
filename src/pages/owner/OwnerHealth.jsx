import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import OwnerHealthRow, { OWNER_HEALTH_GRID } from "./OwnerHealthRow";
import OwnerVaccineStatus from "./OwnerVaccineStatus";
import { getActiveLockDates, getHealthStatuses, getOwnerHorses, getOwnerVaccinations } from "../../services/ownerService";
import { formatDate } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const LABEL = "text-[11px] font-medium tracking-[0.16em] text-stone uppercase";
const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";
const isDone = (v) => v.TrangThai === "Đã tiêm";

// "Sức khỏe" của Chủ ngựa — CHỈ XEM, ngựa có HORSE.OwnerID = người đang đăng nhập. KHÔNG có chẩn đoán / phác đồ / bệnh án.
// Khối 1 "Tình trạng hiện tại": mỗi ngựa 1 hàng (sức khỏe, có thể thi đấu không, mũi tiêm tiếp theo).
// Khối 2 "Lịch tiêm phòng": mọi mũi tiêm của các ngựa, ngày tăng dần; mũi đã tiêm xếp sau cùng.
export default function OwnerHealth() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [horses, setHorses] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [lockByHorse, setLockByHorse] = useState({});
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock ownerService)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const horseList = await getOwnerHorses(ownerId);
      const ids = horseList.map((h) => h.HorseID);
      const [healthList, locks, vaccineList] = await Promise.all([getHealthStatuses(), getActiveLockDates(ids), getOwnerVaccinations(ids)]);
      if (ignore) return;
      setHorses(horseList);
      setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h])));
      setLockByHorse(locks);
      setVaccinations(vaccineList);
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;
  // vaccinations đã sắp NgayHen tăng dần: mũi chưa tiêm trước, đã tiêm sau cùng (mỗi nhóm vẫn theo ngày tăng dần)
  const schedule = [...vaccinations.filter((v) => !isDone(v)), ...vaccinations.filter(isDone)];

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Sức khỏe</h1>
        <p className="mt-1 text-stone">Tình trạng và lịch tiêm phòng của ngựa bạn.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : horses.length === 0 ? (
        <div className="border-y border-stone/20 py-16 text-center">
          <p className="font-serif text-lg font-semibold text-ink">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-stone">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <>
          <section aria-label="Tình trạng hiện tại">
            <h2 className={LABEL}>Tình trạng hiện tại</h2>
            <div aria-hidden="true" className={`mt-3 hidden border-b border-stone/20 pr-2 pb-2 pl-1 min-[900px]:grid ${OWNER_HEALTH_GRID}`}>
              <span className={HEAD_CELL}>Ngựa</span>
              <span className={HEAD_CELL}>Sức khỏe</span>
              <span className={HEAD_CELL}>Thi đấu</span>
              <span className={HEAD_CELL}>Tiêm tiếp theo</span>
            </div>
            <ul className="border-t border-stone/20 min-[900px]:border-t-0">
              {horses.map((horse) => (
                <OwnerHealthRow
                  key={horse.HorseID}
                  horse={horse}
                  health={healthByHorse[horse.HorseID]}
                  lock={lockByHorse[horse.HorseID]}
                  nextVaccine={vaccinations.find((v) => v.HorseID === horse.HorseID && !isDone(v))}
                />
              ))}
            </ul>
          </section>

          <section aria-label="Lịch tiêm phòng" className="mt-10">
            <h2 className={LABEL}>Lịch tiêm phòng</h2>
            {schedule.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Chưa có lịch tiêm nào.</p>
            ) : (
              <ul className="mt-2 border-t border-stone/20">
                {schedule.map((v) => (
                  <li
                    key={v.ScheduleID}
                    className={`grid grid-cols-[96px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] whitespace-nowrap ${
                      isDone(v) ? "text-stone" : ""
                    }`}
                  >
                    <span className={`tabular-nums ${isDone(v) ? "text-stone" : "text-ink"}`}>{formatDate(v.NgayHen)}</span>
                    <span className={`truncate ${isDone(v) ? "text-stone" : "text-ink"}`}>
                      {v.Loai} · {horseName(v.HorseID)}
                    </span>
                    <OwnerVaccineStatus vaccination={v} className="text-right text-sm" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
