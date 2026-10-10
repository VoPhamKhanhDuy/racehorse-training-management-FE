import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import StatusBadge from "../../components/StatusBadge";
import { getHealthStatuses, getHorses, getSchedules, getUsers } from "../../services/trainerService";
import { todayISO } from "../../utils/date";

export default function Dashboard() {
  const [horses, setHorses] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHealthStatuses(), getSchedules(todayISO()), getUsers()]).then(
      ([horseList, healthList, scheduleList, userList]) => {
        if (ignore) return;
        setHorses(horseList);
        setHealthStatuses(healthList);
        setTodaySchedules(scheduleList);
        setUsers(userList);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <LoadingState />;

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const userNames = Object.fromEntries(users.map((u) => [u.UserID, u.HoTen]));
  const readyCount = healthStatuses.filter((h) => h.TrangThai === "Tốt").length;
  const attentionList = healthStatuses.filter((h) => h.TrangThai !== "Tốt");

  const stats = [
    { label: "Ngựa đủ điều kiện tập", value: readyCount, hint: `trên tổng ${horses.length} ngựa` },
    { label: "Buổi tập hôm nay", value: todaySchedules.length, hint: "theo lịch đã phân công" },
    { label: "Cần theo dõi / chấn thương", value: attentionList.length, hint: "theo hồ sơ sức khỏe" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard thể lực</h1>
        <p className="mt-1 text-[#6E6E76]">Tổng quan tình trạng đàn ngựa và lịch tập hôm nay.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6E6E76]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-[#6E6E76]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Lịch tập hôm nay</h2>
            <Link to="/trainer/schedule" className="text-sm font-medium text-[#C65D18] hover:underline">
              Xem tất cả
            </Link>
          </div>
          {todaySchedules.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#6E6E76]">Hôm nay không có buổi tập.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todaySchedules.map((schedule) => (
                <li key={schedule.ScheduleID} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-12 font-semibold text-[#C65D18]">{schedule.Gio}</span>
                  <span className="flex-1 truncate font-medium">{horseById[schedule.HorseID]?.Ten}</span>
                  <span className="text-[#6E6E76]">{userNames[schedule.GroomID]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold">Ngựa cần chú ý</h2>
          {attentionList.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#6E6E76]">Tất cả ngựa đều đủ điều kiện tập.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {attentionList.map((health) => {
                const horse = horseById[health.HorseID];
                return (
                  <li key={health.HorseID} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-medium">{horse?.Ten ?? `Ngựa #${health.HorseID}`}</span>
                      {horse && (
                        <span className="text-[#6E6E76]">
                          {" "}· {horse.Giong} · {horse.Tuoi} tuổi
                        </span>
                      )}
                    </span>
                    <StatusBadge status={health.TrangThai} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
