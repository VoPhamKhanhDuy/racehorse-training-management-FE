import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import useHorseRealtime from "../../hooks/useHorseRealtime";
import OwnerHorseDetail from "./OwnerHorseDetail";
import { getHealthStatuses, getLockedHorseIds, getOwnerHorseDetail } from "../../services/ownerService";

// Chi tiết 1 ngựa của Chủ ngựa (/owner/horses/:id) — CHỈ XEM, dùng "thẻ ngựa" OwnerHorseDetail.
// Chỉ xem được ngựa của chính mình: id không tồn tại hoặc ngựa của người khác → về /owner/horses.
export default function OwnerHorseProfile() {
  const { id } = useParams();

  const [data, setData] = useState(null); // { horse, health, locked, care, achievements, activities } hoặc null
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [detail, healthList, locked] = await Promise.all([
        getOwnerHorseDetail(id),
        getHealthStatuses(),
        getLockedHorseIds(),
      ]);
      if (!detail?.horse) {
        setMissing(true);
        setData(null);
        return;
      }
      setMissing(false);
      setData({
        horse: detail.horse,
        health: healthList.find((h) => h.HorseID === detail.horse.HorseID),
        locked: locked.has(detail.horse.HorseID),
        care: detail.care,
        achievements: detail.achievements,
        activities: detail.activities ?? [],
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      await load();
      if (ignore) return;
    })();
    return () => {
      ignore = true;
    };
  }, [load]);

  useHorseRealtime(
    () => {
      load({ silent: true });
    },
    { horseIdFilter: id }
  );

  if (loading && !data) return <LoadingState />;
  if (missing || !data) return <Navigate to="/owner/horses" replace />;

  return (
    <div className="max-w-[1040px]">
      <Link to="/owner/horses" className="text-sm text-stone underline-offset-2 hover:text-ink hover:underline">
        ← Ngựa của tôi
      </Link>
      <div className="mt-6">
        <OwnerHorseDetail {...data} />
      </div>
    </div>
  );
}
