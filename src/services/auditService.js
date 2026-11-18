// Nhật ký thao tác (bảng AuditLog) — API thật:
//   POST /api/audit-logs          mọi role đã đăng nhập ghi 1 dòng (BE lấy người thực hiện từ JWT)
//   GET  /api/manager/audit-logs  Club Manager xem, lọc theo người / ngày / từ khóa, phân trang
import { apiRequest } from "./apiClient";

// Nhóm hành động theo bảng bị tác động — dùng cho pill lọc và icon trên timeline
export const AUDIT_CATEGORIES = {
  USER: "Tài khoản",
  HORSE: "Hồ sơ ngựa",
  HEALTHSTATUS: "Sức khỏe",
  TRAININGPLAN: "Giáo án",
  TRAININGSESSION: "Buổi tập",
  TRAININGLOCK: "Khóa huấn luyện",
  VACCINATIONSCHEDULE: "Tiêm phòng",
  CARETASK: "Chăm sóc",
  INCIDENTREPORT: "Sự cố",
  RACEREGISTRATION: "Thi đấu",
  EXPENSE: "Tài chính",
  SUPPLY: "Vật tư",
};

// Giới từ đứng trước đối tượng trong câu "<người> đã <hành động> [giới từ] <tên>"
const TARGET_PREFIX = {
  TRAININGPLAN: "cho",
  TRAININGSESSION: "của",
  CARETASK: "của",
  EXPENSE: "cho",
  INCIDENTREPORT: "cho",
  VACCINATIONSCHEDULE: "cho",
  TRAININGLOCK: "cho",
  HEALTHSTATUS: "của",
};

// Kết quả thi đấu: HanhDong đã ghi đủ tên giải + ngựa + hạng, không cần đối tượng phía sau
const NO_TARGET_NAME = new Set(["RACEREGISTRATION"]);

// Ghi 1 dòng nhật ký. Lỗi ghi log KHÔNG BAO GIỜ được làm hỏng thao tác chính: hàm không throw, không cần await,
// mọi lỗi chỉ console.warn. UserID truyền vào chỉ để tương thích chỗ gọi cũ — BE luôn lấy người thực hiện từ JWT.
// targetLabel: tên đối tượng lúc ghi (vd tên ngựa) — timeline hiện tên này, kể cả khi bản ghi đã bị xóa.
export function addAuditLog({ HanhDong, TargetTable, TargetID, targetLabel }) {
  try {
    apiRequest("/audit-logs", {
      method: "POST",
      body: {
        action: HanhDong,
        targetTable: TargetTable,
        targetId: Number.isInteger(TargetID) ? TargetID : null,
        targetLabel: targetLabel ?? null,
      },
    }).catch((err) => console.warn("Không ghi được nhật ký thao tác:", err?.message ?? err));
  } catch (err) {
    console.warn("Không ghi được nhật ký thao tác:", err?.message ?? err);
  }
}

function mapAuditLog(raw) {
  const table = raw.targetTable;
  const targetName = NO_TARGET_NAME.has(table)
    ? ""
    : (raw.targetLabel ?? (raw.targetId != null ? `#${raw.targetId}` : ""));
  return {
    LogID: raw.logId,
    UserID: raw.userId,
    HanhDong: raw.action,
    TargetTable: table,
    TargetID: raw.targetId,
    ThoiGian: String(raw.createdAt).slice(0, 16), // "YYYY-MM-DDTHH:mm" (bỏ giây)
    actorName: raw.actorName,
    actorRole: raw.actorRole,
    targetPrefix: targetName ? (TARGET_PREFIX[table] ?? "") : "",
    targetName,
    category: AUDIT_CATEGORIES[table] ?? "Khác",
  };
}

// filters: { userId, keyword, from, to, page, pageSize } (from/to: "YYYY-MM-DD", tính cả ngày đó)
export async function getAuditLogs({ userId, keyword, from, to, page = 1, pageSize = 20 } = {}) {
  const data = await apiRequest("/manager/audit-logs", {
    query: { userId: userId || undefined, keyword: keyword || undefined, from, to, page, pageSize },
  });
  return {
    items: (data?.items ?? []).map(mapAuditLog),
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
  };
}
