import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import {
  getActiveLockDates,
  getOwnerHorses,
  getOwnerTrainingOverview,
  getRaceRegistrations,
  getRaces,
} from "../../services/ownerService";
import { formatDate, formatDayMonth, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const LABEL = "text-[11px] font-medium tracking-[0.16em] text-stone uppercase";
const SESSION_LIMIT = 6;

// "Lịch trình" của Chủ ngựa — CHỈ XEM, ngựa có HORSE.OwnerID = người đang đăng nhập.
// Khối 1 "Sắp tới": buổi tập (TRAININGSCHEDULE) + giải đã đăng ký (RACEREGISTRATION → RACE) gộp 1 danh sách theo ngày tăng
// dần, chỉ từ hôm nay. Ngựa đang khóa tập: không có buổi tập, kèm dòng "Đang tạm ngưng huấn luyện" (không hiện lý do).
// Khối 2 "Nhận xét gần đây": 6 buổi TRAININGSESSION gần nhất — chỉ ngày, tên ngựa, chỉ số tập, nhận xét của HLV.
export default function OwnerSchedule() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [horses, setHorses] = useState([]);
  const [lockByHorse, setLockByHorse] = useState({});
  const [training, setTraining] = useState({ schedules: [], plans: [], sessions: [] });
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock ownerService)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const horseList = await getOwnerHorses(ownerId);
      const ids = horseList.map((h) => h.HorseID);
      const [locks, overview, raceList, registrationList] = await Promise.all([
        getActiveLockDates(ids),
        getOwnerTrainingOverview(ids),
        getRaces(),
        getRaceRegistrations(),
      ]);
      if (ignore) return;
      setHorses(horseList);
      setLockByHorse(locks);
      setTraining(overview);
      setRaces(raceList);
      setRegistrations(registrationList.filter((r) => ids.includes(r.HorseID)));
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  const today = todayISO();
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseName = (horseId) => horseById[horseId]?.Ten ?? `Ngựa #${horseId}`;
  // Giai đoạn huấn luyện: giáo án lập gần nhất của ngựa (plans đã sắp PlanID mới → cũ; ERD chưa nối buổi tập với giáo án)
  const phaseOf = (horseId) => training.plans.find((p) => p.HorseID === horseId)?.GiaiDoan;

  const trainingItems = training.schedules
    .filter((s) => s.Ngay >= today && !lockByHorse[s.HorseID])
    .map((s) => ({
      key: `s${s.ScheduleID}`,
      kind: "Tập",
      horseId: s.HorseID,
      date: s.Ngay,
      time: s.Gio,
      title: "Buổi tập",
      detail: phaseOf(s.HorseID),
    }));
  const raceItems = registrations
    .map((r) => ({ registration: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race && race.Ngay >= today)
    .map(({ registration, race }) => ({
      key: `r${race.RaceID}-${registration.HorseID}`,
      kind: "Thi đấu",
      horseId: registration.HorseID,
      date: race.Ngay,
      time: "",
      title: race.TenGiai,
      detail: race.DiaDiem,
    }));
  const upcoming = [...trainingItems, ...raceItems].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const recentSessions = training.sessions.slice(0, SESSION_LIMIT); // đã sắp mới → cũ

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Lịch trình</h1>
        <p className="mt-1 text-stone">Lịch tập, lịch thi đấu và nhận xét của huấn luyện viên.</p>
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
          <section aria-label="Sắp tới">
            <h2 className={LABEL}>Sắp tới</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Chưa có lịch sắp tới</p>
            ) : (
              <ul className="mt-2 border-t border-stone/20">
                {upcoming.map((item) => (
                  <li
                    key={item.key}
                    className="grid grid-cols-[64px_minmax(0,0.9fr)_minmax(0,1.4fr)_auto] items-baseline gap-x-4 border-b border-stone/15 py-3 pr-2 pl-1 text-[15px] whitespace-nowrap"
                  >
                    <span>
                      <span className="block text-stone tabular-nums">{formatDayMonth(item.date)}</span>
                      {item.time && <span className="block text-xs text-stone/80 tabular-nums">{item.time}</span>}
                    </span>
                    <span className="min-w-0">
                      <Link
                        to={`/owner/horses/${item.horseId}`}
                        className="block truncate font-serif text-base font-semibold text-[#2b2118] underline-offset-2 hover:underline"
                      >
                        {horseName(item.horseId)}
                      </Link>
                      {lockByHorse[item.horseId] && (
                        <span className="block truncate text-xs text-brass-deep">Đang tạm ngưng huấn luyện</span>
                      )}
                    </span>
                    <span className="min-w-0 truncate text-ink" title={[item.title, item.detail].filter(Boolean).join(" · ")}>
                      {item.title}
                      {item.detail && <span className="text-stone"> · {item.detail}</span>}
                    </span>
                    <span className={`text-right text-sm ${item.kind === "Thi đấu" ? "font-semibold text-[#c2570c]" : "text-stone"}`}>
                      {item.kind}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Nhận xét gần đây" className="mt-10">
            <h2 className={LABEL}>Nhận xét gần đây</h2>
            {recentSessions.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Chưa có nhận xét</p>
            ) : (
              <ul className="mt-2 border-t border-stone/20">
                {recentSessions.map((session) => (
                  <li key={session.SessionID} className="border-b border-stone/15 py-3.5 pr-2 pl-1">
                    <p className="flex items-baseline justify-between gap-4 text-sm text-stone">
                      <span>
                        <span className="tabular-nums">{formatDate(session.Ngay)}</span> · {horseName(session.HorseID)}
                      </span>
                      {session.ChiSoTap !== undefined && session.ChiSoTap !== null && (
                        <span className="text-xs text-stone/70 tabular-nums">Chỉ số tập {session.ChiSoTap}</span>
                      )}
                    </p>
                    <p className="mt-1 line-clamp-3 font-serif text-base leading-relaxed text-ink italic">
                      {session.NhanXet || <span className="text-stone/60 not-italic">Chưa có nhận xét</span>}
                    </p>
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
