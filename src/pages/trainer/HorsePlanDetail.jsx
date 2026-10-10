import { Link } from "react-router-dom";
import HorseRecentSessions from "./HorseRecentSessions";
import HorseSummary from "./HorseSummary";
import TrainingLockNotice from "./TrainingLockNotice";
import { PLAN_UNITS, TRAINING_PHASES } from "../../data/trainingPlanOptions";

const formatNumber = (value) => value.toLocaleString("vi-VN");
const newPlanLink = (horseId, phase) => `/trainer/plans/new?${new URLSearchParams({ horse: horseId, phase })}`;

// Cột phải: chi tiết 1 ngựa, theo thứ tự: thông tin ngựa → cảnh báo khóa tập → đường dọc 4 mốc → buổi tập gần đây.
// Mốc có giáo án: chấm cam + số liệu + "Sửa". Mốc chưa có: chấm xám rỗng + "Chưa lập · Lập". Xóa nằm trong form sửa.
// healthStatus: HEALTHSTATUS.TrangThai (có thể chưa có). lock: bản ghi TRAININGLOCK chưa gỡ (null nếu không khóa).
export default function HorsePlanDetail({ horse, plans, healthStatus, lock, lockedByName, sessions, currentUserId }) {
  const planByPhase = Object.fromEntries(plans.map((p) => [p.GiaiDoan, p]));
  const firstMissingPhase = TRAINING_PHASES.find((phase) => !planByPhase[phase]);

  return (
    <section aria-label={`Giáo án của ${horse.Ten}`}>
      <div className="flex flex-wrap items-center gap-4 border-b border-stone/15 pb-5">
        {/* min-w-56: màn hẹp không đủ chỗ thì nút "+ Lập giáo án" tự xuống hàng riêng, hàng thông tin không bị bóp */}
        <div className="min-w-56 flex-1">
          <HorseSummary horse={horse} healthStatus={healthStatus} />
        </div>
        {/* Lập giáo án cho giai đoạn còn trống đầu tiên; đủ 4 giai đoạn thì không còn gì để lập */}
        {firstMissingPhase ? (
          <Link
            to={newPlanLink(horse.HorseID, firstMissingPhase)}
            className="rounded-sm bg-brass px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/85"
          >
            + Lập giáo án
          </Link>
        ) : (
          <span className="text-sm text-stone">Đã đủ 4 giai đoạn</span>
        )}

        {/* Cảnh báo khóa tập — chỉ nhắc, không chặn lập giáo án */}
        {lock && (
          <div className="w-full">
            <TrainingLockNotice lock={lock} lockedByName={lockedByName} />
          </div>
        )}
      </div>

      <ol className="mt-5">
        {TRAINING_PHASES.map((phase, index) => {
          const plan = planByPhase[phase];
          const isLast = index === TRAINING_PHASES.length - 1;
          return (
            <li key={phase} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Đường dọc nối từ mốc này xuống mốc sau */}
              {!isLast && <span aria-hidden="true" className="absolute top-4 bottom-0 left-[5px] w-px bg-stone/25" />}
              <span
                aria-hidden="true"
                className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${
                  plan ? "bg-brass" : "border-2 border-stone/40 bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                {plan ? (
                  <>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-medium text-ink">{phase}</p>
                      {plan.CreatedBy === currentUserId ? (
                        <Link
                          to={`/trainer/plans/${plan.PlanID}/edit`}
                          aria-label={`Sửa giáo án giai đoạn ${phase}`}
                          className="text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
                        >
                          Sửa
                        </Link>
                      ) : (
                        <span className="text-sm text-stone" title="Chỉ người tạo giáo án mới được sửa">
                          Chỉ xem
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-stone tabular-nums">
                      {formatNumber(plan.CuLy)} {PLAN_UNITS.CuLy} · {formatNumber(plan.KhoiLuong)} {PLAN_UNITS.KhoiLuong} ·{" "}
                      {plan.MatSan}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-stone">{phase}</p>
                    <p className="mt-0.5 text-sm text-stone">
                      Chưa lập ·{" "}
                      <Link
                        to={newPlanLink(horse.HorseID, phase)}
                        aria-label={`Lập giáo án giai đoạn ${phase}`}
                        className="font-medium text-brass-deep underline-offset-2 hover:underline"
                      >
                        Lập
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <HorseRecentSessions horseId={horse.HorseID} sessions={sessions} />
    </section>
  );
}
