import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import OwnerHorseDetail from "./OwnerHorseDetail";
import {
  getHealthStatuses,
  getHorseDailyCare,
  getLockedHorseIds,
  getOwnerHorse,
  getRaceRegistrations,
  getRaces,
} from "../../services/ownerService";
import { getHorseAchievements } from "../../utils/horseAchievements";
import { toUserID } from "../../utils/userId";

// Chi tiết 1 ngựa của Chủ ngựa (/owner/horses/:id) — CHỈ XEM, dùng "thẻ ngựa" OwnerHorseDetail.
// Chỉ xem được ngựa của chính mình: id không tồn tại hoặc ngựa của người khác → về /owner/horses.
export default function OwnerHorseProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [data, setData] = useState(null); // { horse, health, locked, care, achievements } hoặc null
  const [loading, setLoading] = useState(true);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock ownerService)
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([getOwnerHorse(ownerId, id), getHealthStatuses(), getLockedHorseIds(), getHorseDailyCare(id), getRaces(), getRaceRegistrations()]).then(
      ([horse, healthList, locked, care, raceList, registrationList]) => {
        if (ignore) return;
        setData(
          horse && {
            horse,
            health: healthList.find((h) => h.HorseID === horse.HorseID),
            locked: locked.has(horse.HorseID),
            care,
            achievements: getHorseAchievements(horse.HorseID, raceList, registrationList),
          }
        );
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [ownerId, id]);

  if (loading) return <LoadingState />;
  if (!data) return <Navigate to="/owner/horses" replace />;

  return (
    <div className="max-w-[1100px]">
      <Link to="/owner/horses" className="text-sm text-stone underline-offset-2 hover:text-ink hover:underline">
        ← Ngựa của tôi
      </Link>
      <div className="mt-6">
        <OwnerHorseDetail {...data} />
      </div>
    </div>
  );
}
