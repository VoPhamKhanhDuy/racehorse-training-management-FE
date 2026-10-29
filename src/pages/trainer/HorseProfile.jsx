import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import HorseProfileIdentity from "./HorseProfileIdentity";
import HorseProfilePlans from "./HorseProfilePlans";
import HorseProfileSessions from "./HorseProfileSessions";
import HorseProfileHealth from "./HorseProfileHealth";
import HorseProfileVaccinations from "./HorseProfileVaccinations";
import HorseProfileRaces from "./HorseProfileRaces";
import {
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorseById,
  getLatestCheckupDate,
  getRaceRegistrations,
  getRaces,
  getTrainingPlans,
  getTrainingSessions,
  getUsers,
  getVaccinationSchedules,
} from "../../services/trainerService";

const BACK_LINK = "text-sm text-[#4a3f33] transition-colors hover:text-[#c2570c]";

// Tải toàn bộ dữ liệu hồ sơ 1 ngựa; horse = null nếu id không tồn tại
async function loadProfile(horseId) {
  const [horse, healthList, lockList, plans, sessions, races, registrations, vaccinations, latestCheckup, users] =
    await Promise.all([
      getHorseById(horseId),
      getHealthStatuses(),
      getActiveTrainingLocks(),
      getTrainingPlans(horseId),
      getTrainingSessions(horseId),
      getRaces(),
      getRaceRegistrations(),
      getVaccinationSchedules(horseId),
      getLatestCheckupDate(horseId),
      getUsers(),
    ]);
  if (!horse) return { horse: null };

  const userName = (userId) => users.find((u) => u.UserID === userId)?.HoTen;
  const lock = lockList.find((l) => l.HorseID === horse.HorseID);
  const raceEntries = registrations
    .filter((r) => r.HorseID === horse.HorseID)
    .map((registration) => ({ registration, race: races.find((race) => race.RaceID === registration.RaceID) }))
    .filter((entry) => entry.race)
    .sort((a, b) => b.race.Ngay.localeCompare(a.race.Ngay));

  return {
    horse,
    ownerName: userName(horse.OwnerID),
    health: healthList.find((h) => h.HorseID === horse.HorseID),
    lock,
    lockedByName: lock ? userName(lock.VetID) : undefined,
    plans,
    sessions,
    vaccinations,
    latestCheckup,
    raceEntries,
  };
}

// Hồ sơ 1 ngựa cho HLV trưởng — CHỈ XEM.
// Từ 900px: 2 cột (2fr | 1fr, gap 24px). Dưới 900px: 1 cột theo thứ tự Sức khỏe → Giáo án → Buổi tập → Vắc-xin → Thi đấu
// (2 khung cột dùng display: contents trên mobile nên các mục xếp lại được bằng order-*).
export default function HorseProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null); // { id, ...dữ liệu } của lần tải gần nhất

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    loadProfile(id).then((data) => {
      if (!ignore) setProfile({ id, ...data });
    });
    return () => {
      ignore = true;
    };
  }, [id]);

  // Đổi :id thì coi như đang tải lại cho tới khi có dữ liệu của đúng ngựa đó
  if (profile?.id !== id) return <LoadingState />;

  if (!profile.horse) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6b6055]">Không tìm thấy hồ sơ ngựa này.</p>
        <Link to="/trainer/horses" className={`mt-2 inline-block ${BACK_LINK}`}>
          ← Về danh sách hồ sơ ngựa
        </Link>
      </div>
    );
  }

  const { horse } = profile;

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link to="/trainer/horses" className={BACK_LINK}>
        ← Hồ sơ ngựa
      </Link>

      <div className="mt-4">
        <HorseProfileIdentity
          horse={horse}
          ownerName={profile.ownerName}
          health={profile.health}
          lock={profile.lock}
          lockedByName={profile.lockedByName}
        />
      </div>

      <div className="mt-6 flex flex-col gap-6 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-[900px]:items-start">
        <div className="contents min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-6">
          <HorseProfilePlans horseId={horse.HorseID} plans={profile.plans} className="order-2" />
          <HorseProfileSessions horseId={horse.HorseID} sessions={profile.sessions} className="order-3" />
        </div>
        <div className="contents min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-6">
          <HorseProfileHealth health={profile.health} latestCheckup={profile.latestCheckup} className="order-1" />
          <HorseProfileVaccinations vaccinations={profile.vaccinations} className="order-4" />
          <HorseProfileRaces entries={profile.raceEntries} className="order-5" />
        </div>
      </div>
    </div>
  );
}
