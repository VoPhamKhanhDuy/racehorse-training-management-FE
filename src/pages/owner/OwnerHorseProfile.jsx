import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import OwnerHorseDetail from "./OwnerHorseDetail";
import { getHealthStatuses, getLockedHorseIds, getOwnerHorseDetail } from "../../services/ownerService";

// Chi tiết 1 ngựa của Chủ ngựa (/owner/horses/:id) — CHỈ XEM, dùng "thẻ ngựa" OwnerHorseDetail.
// Chỉ xem được ngựa của chính mình: id không tồn tại hoặc ngựa của người khác → về /owner/horses.
export default function OwnerHorseProfile() {
  const { id } = useParams();

  const [data, setData] = useState(null); // { horse, health, locked, care, achievements } hoặc null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([getOwnerHorseDetail(id), getHealthStatuses(), getLockedHorseIds()]).then(
      ([detail, healthList, locked]) => {
        if (ignore) return;
        setData(
          detail?.horse && {
            horse: detail.horse,
            health: healthList.find((h) => h.HorseID === detail.horse.HorseID),
            locked: locked.has(detail.horse.HorseID),
            care: detail.care,
            achievements: detail.achievements,
          }
        );
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [id]);

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
