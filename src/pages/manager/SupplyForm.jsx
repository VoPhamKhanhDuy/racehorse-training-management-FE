import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import roles from "../../data/roles";
import { createSupply, getStaffMembers, getSupplies, updateSupply } from "../../services/supplyService";

const roleNameById = Object.fromEntries(roles.map((role) => [role.id, role.name]));
const emptyForm = { TenVatTu: "", Loai: "", SoLuongTon: "", DonGia: "", ManagedBy: "" };

// Dùng chung cho /manager/supplies/new (thêm) và /manager/supplies/:id/edit (sửa)
export default function SupplyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [supplyTypes, setSupplyTypes] = useState([]); // gợi ý cho ô Loại
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock supplyService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getSupplies(), getStaffMembers()]).then(([supplyList, staffList]) => {
      if (ignore) return;
      setSupplyTypes([...new Set(supplyList.map((s) => s.Loai))].sort((a, b) => a.localeCompare(b, "vi")));
      setStaffMembers(staffList);
      if (isEdit) {
        const supply = supplyList.find((s) => s.SupplyID === Number(id));
        if (supply) {
          setForm({
            TenVatTu: supply.TenVatTu,
            Loai: supply.Loai,
            SoLuongTon: String(supply.SoLuongTon),
            DonGia: String(supply.DonGia ?? ""),
            ManagedBy: String(supply.ManagedBy),
          });
        } else {
          setNotFound(true);
        }
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  // Chỉ chọn được nhân sự đang hoạt động; khi sửa vẫn giữ người quản lý hiện tại dù đã bị khóa
  const managerOptions = staffMembers.filter((s) => s.isActive || String(s.UserID) === form.ManagedBy);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.TenVatTu.trim()) newErrors.TenVatTu = "Vui lòng nhập tên vật tư";
    if (!form.Loai.trim()) newErrors.Loai = "Vui lòng nhập loại vật tư";
    const quantity = Number(form.SoLuongTon);
    if (form.SoLuongTon === "" || !Number.isInteger(quantity) || quantity < 0)
      newErrors.SoLuongTon = "Số lượng phải là số nguyên từ 0 trở lên";
    const price = Number(form.DonGia);
    if (form.DonGia === "" || !Number.isInteger(price) || price < 0)
      newErrors.DonGia = "Đơn giá phải là số nguyên (VNĐ) từ 0 trở lên";
    if (!form.ManagedBy) newErrors.ManagedBy = "Vui lòng chọn người quản lý";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const saved = isEdit ? await updateSupply(id, form) : await createSupply(form);
      navigate("/manager/supplies", {
        state: { message: isEdit ? `Đã cập nhật vật tư "${saved.TenVatTu}".` : `Đã thêm vật tư "${saved.TenVatTu}".` },
      });
    } catch {
      setErrors({ form: "Không lưu được vật tư, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không tìm thấy vật tư</h1>
        <p className="mt-2 text-stone">Vật tư này không tồn tại hoặc đã bị xóa.</p>
        <Link to="/manager/supplies" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/manager/supplies" className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại danh sách
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa vật tư" : "Thêm vật tư mới"}
      </h1>
      <p className="mt-2 text-stone">
        {isEdit ? "Cập nhật thông tin vật tư trong kho." : "Thêm một mặt hàng mới vào kho của câu lạc bộ."}
      </p>

      {/* Chia khối bằng hairline giống form tạo tài khoản nhân sự, không card bo tròn có shadow */}
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5 border-t border-stone/20 pt-6">
        {errors.form && (
          <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
        )}

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <FormField
            variant="outline"
            label="Tên vật tư"
            id="TenVatTu"
            name="TenVatTu"
            placeholder="Cám ngựa đua"
            value={form.TenVatTu}
            onChange={handleChange}
            error={errors.TenVatTu}
          />
          {/* Gõ loại mới hoặc chọn từ gợi ý các loại đã có */}
          <FormField
            variant="outline"
            label="Loại"
            id="Loai"
            name="Loai"
            list="supplyTypeOptions"
            placeholder="Thức ăn, Y tế, Dụng cụ..."
            autoComplete="off"
            value={form.Loai}
            onChange={handleChange}
            error={errors.Loai}
          />
          <datalist id="supplyTypeOptions">
            {supplyTypes.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <div>
            {/* Khi sửa: tồn kho chỉ đổi qua Nhập/Xuất kho ở danh sách để số liệu không bị ghi đè tùy ý */}
            <FormField
              variant="outline"
              label={isEdit ? "Số lượng tồn" : "Số lượng tồn ban đầu"}
              id="SoLuongTon"
              name="SoLuongTon"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              disabled={isEdit}
              value={form.SoLuongTon}
              onChange={handleChange}
              error={errors.SoLuongTon}
            />
            {isEdit && <p className="mt-1.5 text-xs text-stone">Dùng Nhập kho / Xuất kho ở danh sách để thay đổi tồn kho.</p>}
          </div>
          {/* Đơn giá dùng tính giá trị tồn kho ở trang Báo cáo */}
          <FormField
            variant="outline"
            label="Đơn giá (VNĐ)"
            id="DonGia"
            name="DonGia"
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            placeholder="450000"
            value={form.DonGia}
            onChange={handleChange}
            error={errors.DonGia}
          />
        </div>

        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <SelectField
            variant="outline"
            label="Người quản lý"
            id="ManagedBy"
            name="ManagedBy"
            value={form.ManagedBy}
            onChange={handleChange}
            error={errors.ManagedBy}
          >
            <option value="">Chọn nhân sự phụ trách</option>
            {managerOptions.map((staff) => (
              <option key={staff.UserID} value={staff.UserID}>
                {staff.HoTen} — {roleNameById[staff.roleId]}
                {staff.isActive ? "" : " (đã khóa)"}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="border-t border-stone/20 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-sm bg-brass py-3 font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm vật tư"}
          </button>
        </div>
      </form>
    </div>
  );
}
