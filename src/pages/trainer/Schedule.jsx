import { useEffect, useState } from "react";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import { getHorses, getSchedules, getUsers } from "../../services/trainerService";
import { formatDate, todayISO } from "../../utils/date";

export default function Schedule() {
  const [date, setDate] = useState(todayISO());
  const [horses, setHorses] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getHorses(), getUsers()]).then(([horseList, userList]) => {
      setHorses(horseList);
      setUsers(userList);
    });
  }, []);

  // Tải lại lịch mỗi khi đổi ngày
  useEffect(() => {
    let ignore = false;
    getSchedules(date).then((list) => {
      if (ignore) return;
      setSchedules(list);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [date]);

  const changeDate = (newDate) => {
    if (!newDate || newDate === date) return;
    setLoading(true);
    setDate(newDate);
  };

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const userNames = Object.fromEntries(users.map((u) => [u.UserID, u.HoTen]));
  const isToday = date === todayISO();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lịch tập</h1>
        <p className="mt-1 text-[#6E6E76]">
          {isToday ? "Các buổi tập hôm nay" : `Các buổi tập ngày ${formatDate(date)}`} — do nhân viên chăm sóc
          thực hiện theo giáo án.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-2 border-b border-gray-100 p-4">
          <div className="w-44">
            <FormField label="Chọn ngày" id="date" type="date" value={date} onChange={(e) => changeDate(e.target.value)} />
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={() => changeDate(todayISO())}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
            >
              Hôm nay
            </button>
          )}
        </div>
        {loading ? (
          <LoadingState />
        ) : schedules.length === 0 ? (
          <p className="py-16 text-center text-[#6E6E76]">Không có buổi tập nào trong ngày này.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {schedules.map((schedule) => {
              const horse = horseById[schedule.HorseID];
              return (
                <li key={schedule.ScheduleID} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-14 shrink-0 text-lg font-bold text-[#C65D18]">{schedule.Gio}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{horse?.Ten ?? `Ngựa #${schedule.HorseID}`}</p>
                    <p className="truncate text-sm text-[#6E6E76]">{horse?.Giong}</p>
                  </div>
                  <p className="text-right text-sm text-[#6E6E76]">
                    Thực hiện
                    <br />
                    <span className="font-medium text-[#232328]">
                      {userNames[schedule.GroomID] ?? `#${schedule.GroomID}`}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
