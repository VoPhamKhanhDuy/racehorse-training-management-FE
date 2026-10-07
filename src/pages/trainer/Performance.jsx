import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import Modal from "../../components/Modal";
import SelectField from "../../components/SelectField";
import StatusBadge from "../../components/StatusBadge";
import PerformanceForm from "./PerformanceForm";
import { addTrainingSession, getHorses, getTrainingSessions } from "../../services/trainerService";
import { formatDate } from "../../utils/date";

export default function Performance() {
  const [horses, setHorses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [horseFilter, setHorseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    getHorses().then(setHorses);
  }, []);

  // Tải lại đánh giá mỗi khi đổi bộ lọc ngựa
  useEffect(() => {
    let ignore = false;
    getTrainingSessions(horseFilter || undefined).then((list) => {
      if (ignore) return;
      setSessions(list);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [horseFilter]);

  const changeHorseFilter = (horseId) => {
    if (horseId === horseFilter) return;
    setLoading(true);
    setHorseFilter(horseId);
  };

  const horseNames = Object.fromEntries(horses.map((h) => [h.HorseID, h.Ten]));

  const handleAdd = async (data) => {
    const newSession = await addTrainingSession(data);
    if (!horseFilter || Number(horseFilter) === newSession.HorseID) {
      setSessions((prev) => [newSession, ...prev]);
    }
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Đánh giá phong độ</h1>
          <p className="mt-1 text-[#6E6E76]">Chỉ số và nhận xét chuyên môn sau mỗi buổi tập.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={horses.length === 0}
          className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Thêm đánh giá
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="w-full sm:w-56">
            <SelectField label="Lọc theo ngựa" id="horseFilter" value={horseFilter} onChange={(e) => changeHorseFilter(e.target.value)}>
              <option value="">Tất cả ngựa</option>
              {horses.map((horse) => (
                <option key={horse.HorseID} value={horse.HorseID}>
                  {horse.Ten}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : sessions.length === 0 ? (
          <p className="py-16 text-center text-[#6E6E76]">Chưa có đánh giá nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[#6E6E76]">
                <tr>
                  <th className="px-5 py-3 font-medium">Ngày</th>
                  <th className="px-5 py-3 font-medium">Ngựa</th>
                  <th className="px-5 py-3 font-medium">Nhịp tim</th>
                  <th className="px-5 py-3 font-medium">Vận tốc</th>
                  <th className="px-5 py-3 font-medium">Chỉ số tập</th>
                  <th className="px-5 py-3 font-medium">Nhận xét</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={session.SessionID} className="hover:bg-gray-50/60">
                    <td className="px-5 py-4 whitespace-nowrap text-[#6E6E76]">{formatDate(session.Ngay)}</td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">
                      {horseNames[session.HorseID] ?? `Ngựa #${session.HorseID}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{session.NhipTim} nhịp/phút</td>
                    <td className="px-5 py-4 whitespace-nowrap">{session.VanToc.toLocaleString("vi-VN")} m/s</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={session.ChiSoTap} />
                    </td>
                    <td className="px-5 py-4">{session.NhanXet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title="Thêm đánh giá phong độ" onClose={() => setFormOpen(false)}>
        <PerformanceForm horses={horses} onSubmit={handleAdd} onCancel={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
