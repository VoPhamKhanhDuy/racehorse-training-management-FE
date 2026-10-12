import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import SectionTitle from "../../components/SectionTitle";
import useAuth from "../../hooks/useAuth";
import {
  getActiveLockDates,
  getOwnerHorses,
  getOwnerTrainingOverview,
  getRaceRegistrations,
  getRaces,
} from "../../services/ownerService";
import { daysBetween, formatDate, formatDayMonth, todayISO, weekdayName } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const SESSION_LIMIT = 6;
const UPCOMING_DAY_LIMIT = 5;

// "Thi đấu · còn 6 ngày" / "Thi đấu · ngày mai" / "Thi đấu · hôm nay"
function raceCountdownText(days) {
  if (days <= 0) return "Thi đấu · hôm nay";
  if (days === 1) return "Thi đấu · ngày mai";
  return `Thi đấu · còn ${days} ngày`;
}

// "Lịch trình" của Chủ ngựa — CHỈ XEM, ngựa có HORSE.OwnerID = người đang đăng nhập.
// Khối 1 "Sắp tới" (kiểu agenda): buổi tập (TRAININGSCHEDULE) + giải đã đăng ký (RACEREGISTRATION → RACE), chỉ từ hôm nay,
// nhóm theo ngày ("Thứ Ba, 13/10"); hiện 5 ngày gần nhất + "Xem thêm". Ngựa đang khóa tập: không có buổi tập, có dòng
// "Đang tạm ngưng huấn luyện" phía trên danh sách (không hiện lý do).
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
  const [showAllDays, setShowAllDays] = useState(false);

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

  // Giai đoạn huấn luyện của từng buổi tập: ERD chưa nối TRAININGSCHEDULE với TRAININGPLAN, nên các buổi sắp tới của 1 ngựa
  // lần lượt lấy giai đoạn của các giáo án của ngựa đó (PlanID mới → cũ) để không lặp cùng 1 nội dung.
  const upcomingSessions = training.schedules
    .filter((s) => s.Ngay >= today && !lockByHorse[s.HorseID])
    .sort((a, b) => a.Ngay.localeCompare(b.Ngay) || a.Gio.localeCompare(b.Gio));
  const sessionCountByHorse = {};
  const trainingItems = upcomingSessions.map((s) => {
    const plans = training.plans.filter((p) => p.HorseID === s.HorseID);
    const order = (sessionCountByHorse[s.HorseID] = (sessionCountByHorse[s.HorseID] ?? -1) + 1);
    return {
      key: `s${s.ScheduleID}`,
      isRace: false,
      horseId: s.HorseID,
      date: s.Ngay,
      time: s.Gio,
      title: "Buổi tập",
      detail: plans.length > 0 ? plans[order % plans.length].GiaiDoan : "",
    };
  });
  const raceItems = registrations
    .map((r) => ({ registration: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race && race.Ngay >= today)
    .map(({ registration, race }) => ({
      key: `r${race.RaceID}-${registration.HorseID}`,
      isRace: true,
      horseId: registration.HorseID,
      date: race.Ngay,
      time: "",
      title: race.TenGiai,
      detail: race.DiaDiem,
    }));

  // Nhóm theo ngày (tăng dần); trong ngày: giải thi đấu LÊN TRÊN, rồi các buổi tập theo giờ
  const sortedItems = [...trainingItems, ...raceItems].sort(
    (a, b) => a.date.localeCompare(b.date) || Number(b.isRace) - Number(a.isRace) || a.time.localeCompare(b.time)
  );
  const dayGroups = sortedItems.reduce((groups, item) => {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) {
      last.items.push(item);
      last.hasRace = last.hasRace || item.isRace;
    } else {
      groups.push({ date: item.date, items: [item], hasRace: item.isRace });
    }
    return groups;
  }, []);
  const visibleGroups = showAllDays ? dayGroups : dayGroups.slice(0, UPCOMING_DAY_LIMIT);

  const recentSessions = training.sessions.slice(0, SESSION_LIMIT); // đã sắp mới → cũ
  const lockedHorses = horses.filter((h) => lockByHorse[h.HorseID]);

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
            <SectionTitle>Sắp tới</SectionTitle>
            {lockedHorses.map((horse) => (
              <p key={horse.HorseID} className="mb-2 text-sm text-brass-deep">
                {horse.Ten}: Đang tạm ngưng huấn luyện, không có buổi tập sắp tới.
              </p>
            ))}
            {dayGroups.length === 0 ? (
              <p className="text-sm text-stone">Chưa có lịch sắp tới</p>
            ) : (
              <>
                {visibleGroups.map((group, groupIndex) => (
                  <div key={group.date} className={groupIndex === 0 ? "" : "mt-5"}>
                    <h3 className={`border-b border-stone/20 pb-1.5 font-serif text-lg ${group.hasRace ? "text-[#c2570c]" : "text-ink"}`}>
                      {weekdayName(group.date)}, {formatDayMonth(group.date)}
                    </h3>
                    <ul>
                      {group.items.map((item) => (
                        // 1 việc / dòng: giờ 64px (giải thi đấu để trống) | tên ngựa | nội dung | (giải) "Thi đấu · còn N ngày"
                        <li
                          key={item.key}
                          className={`grid grid-cols-[56px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b text-[15px] min-[640px]:grid-cols-[64px_160px_minmax(0,1fr)_auto] ${
                            item.isRace
                              ? "border-[#ecd9c4] bg-[#fbf1e6] py-3.5 pr-2 pl-3 shadow-[inset_3px_0_0_#c2570c]"
                              : "border-stone/10 py-2.5"
                          }`}
                        >
                          <span className="text-stone tabular-nums">{item.time}</span>
                          <Link
                            to={`/owner/horses/${item.horseId}`}
                            className="min-w-0 truncate font-serif text-base text-[#2b2118] no-underline hover:underline"
                          >
                            {horseName(item.horseId)}
                          </Link>
                          <span
                            className="col-span-3 col-start-1 row-start-2 min-w-0 truncate pl-[72px] text-ink min-[640px]:col-span-1 min-[640px]:col-start-auto min-[640px]:row-start-auto min-[640px]:pl-0"
                            title={[item.title, item.detail].filter(Boolean).join(" · ")}
                          >
                            <span className={item.isRace ? "text-[17px] font-bold text-[#2b2118]" : ""}>{item.title}</span>
                            {item.detail && <span className="text-stone"> · {item.detail}</span>}
                          </span>
                          <span className="text-right text-sm font-semibold whitespace-nowrap text-[#c2570c]">
                            {item.isRace ? raceCountdownText(daysBetween(today, item.date)) : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {dayGroups.length > UPCOMING_DAY_LIMIT && !showAllDays && (
                  <button
                    type="button"
                    onClick={() => setShowAllDays(true)}
                    className="mt-4 cursor-pointer text-sm text-stone underline-offset-2 hover:text-ink hover:underline"
                  >
                    Xem thêm ({dayGroups.length - UPCOMING_DAY_LIMIT} ngày)
                  </button>
                )}
              </>
            )}
          </section>

          <section aria-label="Nhận xét gần đây" className="mt-14">
            <SectionTitle>Nhận xét gần đây</SectionTitle>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-stone">Chưa có nhận xét</p>
            ) : (
              <ul className="border-t border-stone/20">
                {recentSessions.map((session, index) => (
                  <li key={session.SessionID} className="border-b border-stone/15 py-3.5 pr-2 pl-1">
                    {/* Mục mới nhất: dòng ngày / ngựa màu mực; nhận xét cùng cỡ 16px với các mục khác */}
                    <p className={`flex items-baseline justify-between gap-4 text-sm ${index === 0 ? "text-ink" : "text-stone"}`}>
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
