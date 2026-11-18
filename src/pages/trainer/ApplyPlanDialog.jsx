import { useEffect, useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import SelectField from "../../components/SelectField";
import { getAssignableStaff } from "../../services/trainingApi";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// "Áp dụng kế hoạch": bắt buộc chọn Groom thực hiện (tài khoản role Groom; mặc định Groom được chọn gần nhất) trước khi Áp dụng.
// onApply(groom): trang cha kiểm tra điều kiện (chủ ngựa đã đồng ý), gọi API áp dụng và nhớ Groom đã chọn; ném lỗi thì hiện trong khung.
export default function ApplyPlanDialog({ plan, busy, onApply, onClose }) {
  const [grooms, setGrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [groomId, setGroomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    getAssignableStaff()
      .then((staff) => {
        if (ignore) return;
        const list = staff.filter((s) => s.roleId === "groom");
        setGrooms(list);
        const last = plan.defaultAssignedToUserId;
        if (last != null && list.some((g) => g.userId === last)) setGroomId(String(last));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được danh sách nhân viên chăm sóc.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [plan.defaultAssignedToUserId]);

  const handleApply = async () => {
    if (!groomId) {
      setError("Vui lòng chọn nhân viên chăm sóc thực hiện");
      return;
    }
    setError("");
    try {
      await onApply(grooms.find((g) => String(g.userId) === groomId));
    } catch (err) {
      setError(err.message || "Không áp dụng được kế hoạch, vui lòng thử lại.");
    }
  };

  const header = <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Áp dụng kế hoạch</h2>;
  const footer = (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
        Hủy
      </button>
      <button type="button" onClick={handleApply} disabled={busy || loading || Boolean(loadError)} className="btn-primary">
        {busy ? "Đang áp dụng..." : "Áp dụng"}
      </button>
    </div>
  );

  return (
    <CenterDialog label="Áp dụng kế hoạch" header={header} footer={footer} onClose={onClose} busy={busy}>
      <p className="text-sm text-[#6b6055]">
        Áp dụng "{plan.planName}" cho {plan.horseName}? Mỗi ngựa chỉ có 1 giáo án đang áp dụng; sau khi áp dụng chỉ sửa được thông tin chung, không sửa giai đoạn.
      </p>
      <div className="mt-5">
        {loadError ? (
          <p className="text-sm text-alert">{loadError}</p>
        ) : (
          <SelectField
            variant="outline"
            label="Nhân viên chăm sóc thực hiện"
            id="applyGroom"
            value={groomId}
            disabled={loading}
            onChange={(e) => {
              setGroomId(e.target.value);
              setError("");
            }}
            error={error}
          >
            <option value="">{loading ? "Đang tải..." : "Chọn nhân viên chăm sóc"}</option>
            {grooms.map((groom) => (
              <option key={groom.userId} value={groom.userId}>
                {groom.fullName}
              </option>
            ))}
          </SelectField>
        )}
        <p className="mt-2 text-[13px] text-[#6b6055]">Các buổi tập sinh ra khi xếp lịch tuần sẽ giao cho người này.</p>
      </div>
    </CenterDialog>
  );
}
