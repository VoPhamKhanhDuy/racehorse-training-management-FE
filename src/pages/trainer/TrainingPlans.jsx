import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import Modal from "../../components/Modal";
import TrainingPlanForm from "./TrainingPlanForm";
import useAuth from "../../hooks/useAuth";
import {
  createTrainingPlan,
  getHealthStatuses,
  getHorses,
  getTrainingPlans,
  getUsers,
} from "../../services/trainerService";
import { toUserID } from "../../utils/userId";

export default function TrainingPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [horses, setHorses] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getTrainingPlans(), getHorses(), getHealthStatuses(), getUsers()]).then(
      ([planList, horseList, healthList, userList]) => {
        if (ignore) return;
        setPlans(planList);
        setHorses(horseList);
        setHealthStatuses(healthList);
        setUsers(userList);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const horseNames = Object.fromEntries(horses.map((h) => [h.HorseID, h.Ten]));
  const userNames = Object.fromEntries(users.map((u) => [u.UserID, u.HoTen]));
  const healthByHorse = Object.fromEntries(healthStatuses.map((h) => [h.HorseID, h.TrangThai]));

  const handleCreate = async (data) => {
    const newPlan = await createTrainingPlan({ ...data, CreatedBy: toUserID(user.id) });
    setPlans((prev) => [newPlan, ...prev]);
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Giáo án huấn luyện</h1>
          <p className="mt-1 text-[#6E6E76]">Lập giáo án theo từng giai đoạn cho từng chiến mã.</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={loading}
          className="cursor-pointer rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          + Thêm giáo án
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <LoadingState />
        ) : plans.length === 0 ? (
          <p className="py-16 text-center text-[#6E6E76]">Chưa có giáo án nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[#6E6E76]">
                <tr>
                  <th className="px-5 py-3 font-medium">Ngựa</th>
                  <th className="px-5 py-3 font-medium">Giai đoạn</th>
                  <th className="px-5 py-3 font-medium">Cự ly</th>
                  <th className="px-5 py-3 font-medium">Khối lượng</th>
                  <th className="px-5 py-3 font-medium">Mặt sân</th>
                  <th className="px-5 py-3 font-medium">Người tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <tr key={plan.PlanID} className="hover:bg-gray-50/60">
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">
                      {horseNames[plan.HorseID] ?? `Ngựa #${plan.HorseID}`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-[#C65D18]">
                        {plan.GiaiDoan}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{plan.CuLy.toLocaleString("vi-VN")} m</td>
                    <td className="px-5 py-4">{plan.KhoiLuong}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#6E6E76]">{plan.MatSan}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#6E6E76]">
                      {userNames[plan.CreatedBy] ?? `#${plan.CreatedBy}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} title="Thêm giáo án" onClose={() => setFormOpen(false)}>
        <TrainingPlanForm
          horses={horses}
          healthByHorse={healthByHorse}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
