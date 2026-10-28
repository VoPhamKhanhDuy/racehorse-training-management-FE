import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, TriangleAlert } from "lucide-react";
import HorseAvatar from "../../components/HorseAvatar";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import {
  getActiveLockDates,
  getOwnerHorses,
  getOwnerTrainingOverview,
  getRaceRegistrations,
  getRaces,
} from "../../services/ownerService";
import { daysBetween, formatDate, todayISO, weekdayName } from "../../utils/date";
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

  // Loại buổi hiển thị ở cuối dòng: buổi tập → phần sau dấu "·" (giai đoạn; trống thì "Buổi tập"); giải thi đấu → "Thi đấu"
  const sessionKind = (item) => (item.isRace ? "Thi đấu" : item.detail || item.title);

  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <div>
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lịch trình</h1>
        <p className="mt-1 text-sm text-[#4a3f33]">Lịch tập, lịch thi đấu và nhận xét của huấn luyện viên.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : horses.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#d9cfba] bg-white py-16 text-center">
          <p className="font-serif text-lg font-semibold text-[#2b2118]">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-[#4a3f33]">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-14 min-[960px]:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-label="Sắp tới" className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Sắp tới</h2>
            <div className="mt-4">
              {lockedHorses.map((horse) => (
                <p
                  key={horse.HorseID}
                  className="mb-2 flex items-start gap-2 rounded-[4px] border border-[#e0cfb4] bg-white px-3.5 py-2.5 text-sm text-[#c2570c]"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span>
                    {horse.Ten}: Đang tạm ngưng huấn luyện, không có buổi tập sắp tới.
                  </span>
                </p>
              ))}
              {dayGroups.length === 0 ? (
                <p className="text-sm text-[#4a3f33]">Chưa có lịch sắp tới</p>
              ) : (
                <>
                  {visibleGroups.map((group, groupIndex) => {
                    const isToday = group.date === today;
                    return (
                      <div key={group.date} className={`flex gap-4 ${groupIndex === 0 && lockedHorses.length === 0 ? "" : "mt-6"}`}>
                        <div className="w-[72px] shrink-0">
                          <p className={`text-[13px] ${isToday ? "font-semibold text-[#c2570c]" : "text-[#6b6055]"}`}>
                            {isToday ? "Hôm nay" : weekdayName(group.date)}
                          </p>
                          <p className={`font-serif text-[32px] leading-tight font-semibold ${isToday ? "text-[#c2570c]" : "text-[#2b2118]"}`}>
                            {group.date.slice(8, 10)}
                          </p>
                          <p className="text-[13px] text-[#6b6055]">tháng {Number(group.date.slice(5, 7))}</p>
                        </div>
                        <ul className="min-w-0 flex-1">
                          {group.items.map((item) => (
                            <li
                              key={item.key}
                              title={[item.title, item.detail, item.isRace ? raceCountdownText(daysBetween(today, item.date)) : ""].filter(Boolean).join(" · ")}
                              className="flex min-h-[52px] items-center gap-3 border-b border-[#d9cfba] px-1 transition-colors last:border-b-0 hover:bg-[#f0efec]"
                            >
                              <span className="w-[52px] shrink-0 text-[15px] text-[#4a3f33] tabular-nums">{item.time}</span>
                              <HorseAvatar horse={horseById[item.horseId]} size={32} square />
                              <Link
                                to={`/owner/horses/${item.horseId}`}
                                className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-[#2b2118] no-underline outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
                              >
                                {horseName(item.horseId)}
                              </Link>
                              <span
                                className={`shrink-0 text-right text-sm whitespace-nowrap ${item.isRace ? "font-semibold text-[#c2570c]" : "text-[#4a3f33]"}`}
                              >
                                {sessionKind(item)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  {dayGroups.length > UPCOMING_DAY_LIMIT && !showAllDays && (
                    <button
                      type="button"
                      onClick={() => setShowAllDays(true)}
                      className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#c2570c] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
                    >
                      Xem thêm ({dayGroups.length - UPCOMING_DAY_LIMIT} ngày)
                      <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          <section aria-label="Nhận xét gần đây" className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Nhận xét gần đây</h2>
            {recentSessions.length === 0 ? (
              <p className="mt-4 text-sm text-[#4a3f33]">Chưa có nhận xét</p>
            ) : (
              <ul className="mt-4">
                {recentSessions.map((session) => (
                  <li key={session.SessionID} className="border-b border-[#d9cfba] py-4 first:pt-0 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <HorseAvatar horse={horseById[session.HorseID]} size={36} square />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-base leading-tight font-semibold text-[#2b2118]">{horseName(session.HorseID)}</p>
                        <p className="text-[13px] text-[#6b6055] tabular-nums">{formatDate(session.Ngay)}</p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-3 text-[15px] leading-[1.55] text-[#2b2118]">
                      {session.NhanXet || <span className="text-[#6b6055]">Chưa có nhận xét</span>}
                    </p>
                    {session.ChiSoTap !== undefined && session.ChiSoTap !== null && (
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="text-[13px] text-[#6b6055]">Chỉ số tập</span>
                        <span className="font-serif text-lg font-semibold text-[#2b2118] tabular-nums">{session.ChiSoTap}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
