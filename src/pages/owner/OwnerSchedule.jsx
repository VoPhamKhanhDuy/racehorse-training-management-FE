import { useCallback, useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import useHorseRealtime from "../../hooks/useHorseRealtime";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { getActiveLockDates, getOwnerHorses, getRaceRegistrations, getRaces } from "../../services/ownerService";
import { getOwnerUpcomingSessions, subscribePlanApprovals } from "../../services/planApprovalMock";
import { getOwnerApprovedRaces, subscribeRaceRegistrations } from "../../services/raceRegistrationMock";
import { getOwnerSessionReviews } from "../../services/sessionReviewMock";
import { addDays, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";
import OwnerPlanApprovals from "./OwnerPlanApprovals";
import OwnerReviewList from "./OwnerReviewList";
import OwnerUpcomingTable, { sessionSubText } from "./OwnerUpcomingTable";

const REVIEW_LIMIT = 5; // tối đa 5 nhận xét
const UPCOMING_DAYS = 14; // cửa sổ 14 ngày tới
const SECTION_TITLE = "font-serif text-[18px] font-semibold text-[#2b2118]";

// "Lịch trình" của Chủ ngựa — CHỈ XEM, ngựa có HORSE.OwnerID = người đang đăng nhập.
// Đầu trang: bảng "Kế hoạch huấn luyện" cần duyệt (OwnerPlanApprovals).
// Khối "Sắp tới" (~65%): bảng buổi tập của kế hoạch ĐÃ ĐỒNG Ý + giải thi đấu (đăng ký thật và đã duyệt qua luồng duyệt) trong 14 ngày tới.
// Ngựa đang khóa tập: không có buổi tập, có dòng "Đang tạm ngưng huấn luyện" phía trên bảng (không hiện lý do).
// Khối "Nhận xét gần đây" (~35%): đánh giá của huấn luyện viên được bật hiển thị cho chủ ngựa, tối đa 5, không có báo cáo thô của Groom.
export default function OwnerSchedule() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [horses, setHorses] = useState([]);
  const [lockByHorse, setLockByHorse] = useState({});
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvedRaces, setApprovedRaces] = useState([]); // cuộc đua đã duyệt qua luồng đăng ký (MOCK — raceRegistrationMock.js)
  const [reviews, setReviews] = useState([]); // đánh giá của HLV được bật hiển thị (MOCK — services/sessionReviewMock.js)
  const [plannedSessions, setPlannedSessions] = useState([]); // buổi tập của kế hoạch đã đồng ý (cùng nguồn với phía Trainer)
  const { label } = useTrainingOptions({ remote: false });

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const horseList = await getOwnerHorses(ownerId);
        const ids = horseList.map((h) => h.HorseID);
        const today = todayISO();
        const range = { from: today, to: addDays(today, UPCOMING_DAYS) };
        const [locks, raceList, registrationList, sessionList, reviewList, approvedRaceList] = await Promise.all([
          getActiveLockDates(ids),
          getRaces(),
          getRaceRegistrations(),
          getOwnerUpcomingSessions(ids, range),
          getOwnerSessionReviews(horseList, REVIEW_LIMIT),
          getOwnerApprovedRaces(ids, range),
        ]);
        setHorses(horseList);
        setLockByHorse(locks);
        setRaces(raceList);
        setRegistrations(registrationList.filter((r) => ids.includes(r.HorseID)));
        setPlannedSessions(sessionList);
        setReviews(reviewList);
        setApprovedRaces(approvedRaceList);
        setLoadError("");
      } catch (err) {
        if (!silent) setLoadError(err.message || "Không tải được lịch trình.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ownerId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Trainer xếp lịch / chủ ngựa vừa duyệt (cùng trình duyệt) → tải lại ngầm
  useEffect(() => subscribePlanApprovals(() => load({ silent: true })), [load]);
  useEffect(() => subscribeRaceRegistrations(() => load({ silent: true })), [load]);

  useHorseRealtime(() => {
    load({ silent: true });
  });

  const today = todayISO();
  const horizon = addDays(today, UPCOMING_DAYS);
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));

  // Buổi tập (kế hoạch đã đồng ý, 14 ngày tới, ngựa không bị khóa tập)
  const trainingItems = plannedSessions
    .filter((s) => s.date >= today && s.date <= horizon && !lockByHorse[s.horseId])
    .map((s) => ({
      key: `s${s.key}`,
      isRace: false,
      horseId: s.horseId,
      date: s.date,
      time: s.time ?? "",
      title: s.title || (s.trainingType ? label("trainingTypes", s.trainingType) : "Buổi tập"),
      sub: sessionSubText(s.distanceKm, s.durationMinutes),
    }));
  // Giải đã đăng ký (BE) trong 14 ngày tới
  const raceItems = registrations
    .map((r) => ({ registration: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race && race.Ngay >= today && race.Ngay <= horizon)
    .map(({ registration, race }) => ({
      key: `r${race.RaceID}-${registration.HorseID}`,
      isRace: true,
      horseId: registration.HorseID,
      date: race.Ngay,
      time: "",
      title: race.TenGiai,
      sub: race.DiaDiem,
    }));
  // Cuộc đua đã duyệt (Trainer → Chủ ngựa → Quản lý) — bỏ trùng với giải đã có trong danh sách đăng ký của BE (cùng ngựa, cùng ngày)
  const knownRaceKeys = new Set(raceItems.map((r) => `${r.horseId}|${r.date}`));
  const approvedRaceItems = approvedRaces
    .filter((r) => !knownRaceKeys.has(`${r.horseId}|${r.date}`))
    .map((r) => ({ key: r.key, isRace: true, horseId: r.horseId, date: r.date, time: "", title: r.name, sub: r.location }));

  // Tăng dần theo ngày giờ; trong cùng ngày giải thi đấu lên trước
  const sortedItems = [...trainingItems, ...raceItems, ...approvedRaceItems].sort(
    (a, b) => a.date.localeCompare(b.date) || Number(b.isRace) - Number(a.isRace) || a.time.localeCompare(b.time)
  );
  const lockedHorses = horses.filter((h) => lockByHorse[h.HorseID]);

  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <div>
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Lịch trình</h1>
        <p className="mt-1 text-sm text-[#4a3f33]">Lịch tập, lịch thi đấu và nhận xét của huấn luyện viên.</p>
      </div>

      {!loading && !loadError && horses.length > 0 && <OwnerPlanApprovals horses={horses} />}

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : horses.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#E3E3E3] bg-white py-16 text-center">
          <p className="font-serif text-lg font-semibold text-[#2b2118]">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-[#4a3f33]">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 min-[960px]:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
          <section aria-label="Sắp tới" className="min-w-0">
            <h2 className={SECTION_TITLE}>Sắp tới</h2>
            <div className="mt-4">
              {lockedHorses.map((horse) => (
                <p
                  key={horse.HorseID}
                  className="mb-2 rounded-[4px] border border-[#E3E3E3] border-l-[3px] border-l-[#9e5954] bg-white px-4 py-2.5 text-sm text-[#1f1f1f]"
                >
                  {horse.Ten}: Đang tạm ngưng huấn luyện, không có buổi tập sắp tới.
                </p>
              ))}
              <OwnerUpcomingTable items={sortedItems} horseById={horseById} />
            </div>
          </section>

          <section aria-label="Nhận xét gần đây" className="min-w-0">
            <h2 className={SECTION_TITLE}>Nhận xét gần đây</h2>
            <div className="mt-4">
              <OwnerReviewList reviews={reviews} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
