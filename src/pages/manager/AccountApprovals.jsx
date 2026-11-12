import { useCallback, useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import ApprovalRow from "./ApprovalRow";
import roles from "../../data/roles";
import { approveAccountApi, fetchOwnerApprovals, rejectAccountApi } from "../../services/authApi";

// Chỉ tài khoản Chủ ngựa tự đăng ký mới cần duyệt; nhân sự nội bộ do Quản lý CLB tạo sẵn ở trạng thái "approved"
const APPROVAL_ROLE_ID = "horse_owner";
const roleNameById = Object.fromEntries(roles.map((role) => [role.id, role.name]));

const STATUS_FILTERS = [
  { status: "all", label: "Tất cả", emptyText: "Chưa có tài khoản chủ ngựa nào." },
  { status: "pending", label: "Đang chờ", statLabel: "Đang chờ duyệt", emptyText: "Không có tài khoản nào đang chờ duyệt." },
  { status: "approved", label: "Đã duyệt", statLabel: "Đã duyệt", emptyText: "Chưa có tài khoản nào được duyệt." },
  { status: "rejected", label: "Đã từ chối", statLabel: "Đã từ chối", emptyText: "Chưa có tài khoản nào bị từ chối." },
];

const ACTIONS = {
  approve: {
    status: "approved",
    title: "Duyệt tài khoản",
    confirmLabel: "Duyệt",
    danger: false,
    confirmText: (a) => `Duyệt tài khoản của "${a.fullName}" (${a.email})? Sau khi duyệt, người này có thể đăng nhập hệ thống.`,
    doneText: (a) => `Đã duyệt tài khoản của "${a.fullName}".`,
  },
  reject: {
    status: "rejected",
    title: "Từ chối tài khoản",
    confirmLabel: "Từ chối",
    danger: true,
    confirmText: (a) => `Từ chối tài khoản của "${a.fullName}" (${a.email})? Người này sẽ không thể đăng nhập hệ thống.`,
    doneText: (a) => `Đã từ chối tài khoản của "${a.fullName}".`,
  },
};

const MESSAGE_STYLES = {
  success: { box: "border-green-700 text-green-800", button: "text-green-700" },
  danger: { box: "border-alert text-alert", button: "text-alert" },
};

export default function AccountApprovals() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null); // { type: "approve" | "reject", account }
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null); // { text, tone: "success" | "danger" }

  const load = useCallback(async () => {
    try {
      const list = await fetchOwnerApprovals();
      setAccounts(list.filter((u) => u.roleId === APPROVAL_ROLE_ID));
      setLoadError("");
    } catch (err) {
      setAccounts([]);
      setLoadError(err.message || "Không tải được danh sách duyệt tài khoản.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countByStatus = (status) => accounts.filter((a) => a.status === status).length;
  const stats = STATUS_FILTERS.filter((f) => f.status !== "all").map((f) => ({
    label: f.statLabel,
    value: countByStatus(f.status),
  }));

  const visibleAccounts = accounts
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .sort((a, b) =>
      statusFilter === "pending" || (statusFilter === "all" && a.status === "pending" && b.status === "pending")
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
  const activeFilter = STATUS_FILTERS.find((f) => f.status === statusFilter);

  const handleConfirm = async () => {
    const { type, account } = pendingAction;
    const action = ACTIONS[type];
    setProcessing(true);
    try {
      const userId = account.userId ?? Number(String(account.id).replace(/\D/g, ""));
      const updated = type === "reject" ? await rejectAccountApi(userId) : await approveAccountApi(userId);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, status: updated?.status ?? action.status } : a))
      );
      setMessage({ text: action.doneText(account), tone: "success" });
    } catch (err) {
      setMessage({
        text: err.message || (type === "reject" ? "Không từ chối được tài khoản." : "Không duyệt được tài khoản."),
        tone: "danger",
      });
    } finally {
      setProcessing(false);
      setPendingAction(null);
    }
  };

  const currentAction = pendingAction ? ACTIONS[pendingAction.type] : null;
  const messageStyle = message ? MESSAGE_STYLES[message.tone] : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Duyệt tài khoản</h1>
        <p className="mt-1 text-stone">Tài khoản Chủ ngựa tự đăng ký cần được duyệt trước khi đăng nhập.</p>
      </div>

      {message && (
        <div
          className={`mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 bg-white/60 px-4 py-3 text-sm ${messageStyle.box}`}
        >
          {message.text}
          <button
            type="button"
            onClick={() => setMessage(null)}
            className={`cursor-pointer font-semibold hover:underline ${messageStyle.button}`}
          >
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 divide-x divide-stone/20 bg-white">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-stone sm:text-sm">{stat.label}</p>
                <p className="mt-0.5 font-serif text-[1.75rem] leading-tight font-semibold text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.status;
              return (
                <button
                  key={f.status}
                  type="button"
                  onClick={() => setStatusFilter(f.status)}
                  aria-pressed={active}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-brass bg-brass/15 font-medium text-brass-deep"
                      : "border-stone/25 bg-white text-ink hover:border-stone/40"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {visibleAccounts.length === 0 ? (
            <div className="border-y border-stone/20 py-16 text-center text-stone">
              <UserCheck className="mx-auto mb-3 h-10 w-10 text-stone/40" />
              {activeFilter.emptyText}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                <thead className="whitespace-nowrap text-stone">
                  <tr>
                    <th className="border-b-2 border-l-4 border-b-brass-deep border-l-transparent px-4 py-3 font-medium">Họ tên</th>
                    <th className="border-b-2 border-b-brass-deep px-4 py-3 font-medium">Email</th>
                    <th className="border-b-2 border-b-brass-deep px-4 py-3 font-medium">Vai trò</th>
                    <th className="border-b-2 border-b-brass-deep px-4 py-3 font-medium">Ngày đăng ký</th>
                    <th className="sticky right-0 border-b-2 border-b-brass-deep bg-white py-3 pr-4 pl-6 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAccounts.map((account) => (
                    <ApprovalRow
                      key={account.id}
                      account={account}
                      roleName={roleNameById[account.roleId]}
                      onApprove={(a) => setPendingAction({ type: "approve", account: a })}
                      onReject={(a) => setPendingAction({ type: "reject", account: a })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={currentAction?.title ?? ""}
        message={pendingAction ? currentAction.confirmText(pendingAction.account) : ""}
        confirmLabel={currentAction?.confirmLabel}
        danger={currentAction?.danger}
        loading={processing}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
