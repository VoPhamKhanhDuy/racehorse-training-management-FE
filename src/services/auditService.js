// TODO: thay bằng gọi API thật khi BE xong (BE ghi log tự động ở mỗi thao tác ghi dữ liệu)
// Mock nhật ký thao tác (bảng AUDITLOG) cho Club Manager — join tên người thực hiện + tên đối tượng bị tác động.
import auditLog from "../data/auditLog";
import healthStatuses from "../data/healthStatuses";
import { getUsers } from "./accountService";
import { getHorses } from "./horseService";
import { getSupplies } from "./supplyService";
import { getTrainingPlans, getTrainingSessions } from "./trainerService";
import { toUserID } from "../utils/userId";

// Nhóm hành động theo bảng bị tác động — dùng cho pill lọc và icon trên timeline
export const AUDIT_CATEGORIES = {
  USER: "Tài khoản",
  HORSE: "Hồ sơ ngựa",
  HEALTHSTATUS: "Sức khỏe",
  TRAININGPLAN: "Giáo án",
  TRAININGSESSION: "Buổi tập",
  SUPPLY: "Vật tư",
};

export async function getAuditLogs() {
  const [users, horses, supplies, plans, sessions] = await Promise.all([
    getUsers(),
    getHorses(),
    getSupplies(),
    getTrainingPlans(),
    getTrainingSessions(),
  ]);
  const userById = Object.fromEntries(users.map((u) => [toUserID(u.id), u]));
  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten;

  // Đối tượng trong câu "<người> đã <hành động> [giới từ] <tên>" → { prefix, name }; bản ghi đã bị xóa thì name = undefined
  const resolveTarget = ({ TargetTable, TargetID }) => {
    switch (TargetTable) {
      case "USER":
        return { name: userById[TargetID]?.fullName };
      case "HORSE":
        return { name: horseName(TargetID) };
      case "SUPPLY":
        return { name: supplies.find((s) => s.SupplyID === TargetID)?.TenVatTu };
      case "TRAININGPLAN": {
        const plan = plans.find((p) => p.PlanID === TargetID);
        return { prefix: "cho", name: plan && horseName(plan.HorseID) };
      }
      case "TRAININGSESSION": {
        const session = sessions.find((s) => s.SessionID === TargetID);
        return { prefix: "của", name: session && horseName(session.HorseID) };
      }
      case "HEALTHSTATUS":
        return { prefix: "của", name: healthStatuses.some((h) => h.HorseID === TargetID) ? horseName(TargetID) : undefined };
      default:
        return {};
    }
  };

  return auditLog
    .map((log) => {
      const target = resolveTarget(log);
      return {
        ...log,
        actorName: userById[log.UserID]?.fullName ?? `Người dùng #${log.UserID}`,
        actorRoleId: userById[log.UserID]?.roleId,
        targetPrefix: target.prefix ?? "",
        targetName: target.name ?? `#${log.TargetID}`,
        category: AUDIT_CATEGORIES[log.TargetTable] ?? "Khác",
      };
    })
    .sort((a, b) => b.ThoiGian.localeCompare(a.ThoiGian));
}
