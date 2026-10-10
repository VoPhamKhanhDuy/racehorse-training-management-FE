import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import ScheduleFormContext from "./ScheduleFormContext";
import {
  cancelSchedule,
  createSchedule,
  getActiveTrainingLocks,
  getGrooms,
  getHealthStatuses,
  getHorses,
  getSchedules,
  getUsers,
  updateSchedule,
} from "../../services/trainerService";
import { formatDate, startOfWeek, todayISO } from "../../utils/date";

const emptyForm = { HorseID: "", GroomID: "", Ngay: "", Gio: "" };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Form lịch tập (TRAININGSCHEDULE), dùng chung cho /trainer/schedule/new và /trainer/schedule/:id/edit.
// Lập mới từ ô trống của lưới tuần: ?date=YYYY-MM-DD&horse=<HorseID> hoặc &groom=<UserID> điền sẵn ngày + đối tượng.
// Ràng buộc: đủ 4 trường; ngày không ở quá khứ (khi thêm); ngựa đang khóa tập thì chặn;
// 1 nhân viên / 1 ngựa không có 2 buổi cùng ngày cùng giờ. Lịch đã qua chỉ xem, không sửa/hủy.
export default function ScheduleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = todayISO();
  const [form, setForm] = useState(emptyForm);
  const [horses, setHorses] = useState([]);
  const [grooms, setGrooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [locks, setLocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedReason, setBlockedReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getGrooms(), getSchedules(), getHealthStatuses(), getActiveTrainingLocks(), getUsers()]).then(
      ([horseList, groomList, scheduleList, healthList, lockList, userList]) => {
        if (ignore) return;
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setGrooms(groomList);
        setSchedules(scheduleList);
        setHealthStatuses(healthList);
        setLocks(lockList);
        setUsers(userList);
        if (isEdit) {
          const schedule = scheduleList.find((s) => s.ScheduleID === Number(id));
          if (!schedule) setBlockedReason("Lịch tập này không tồn tại hoặc đã bị hủy.");
          else if (schedule.Ngay < todayISO()) setBlockedReason("Buổi tập đã qua nên chỉ xem được, không thể sửa hay hủy.");
          else
            setForm({
              HorseID: String(schedule.HorseID),
              GroomID: String(schedule.GroomID),
              Ngay: schedule.Ngay,
              Gio: schedule.Gio,
            });
        } else {
          const dateParam = searchParams.get("date");
          const horseParam = searchParams.get("horse");
          const groomParam = searchParams.get("groom");
          setForm((prev) => ({
            ...prev,
            Ngay: dateParam && DATE_PATTERN.test(dateParam) && dateParam >= todayISO() ? dateParam : prev.Ngay,
            HorseID: horseList.some((h) => String(h.HorseID) === horseParam) ? horseParam : prev.HorseID,
            GroomID: groomList.some((g) => g.isActive && String(g.UserID) === groomParam) ? groomParam : prev.GroomID,
          }));
        }
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [id, isEdit, searchParams]);

  const editingId = isEdit ? Number(id) : null;
  const selectedHorse = horses.find((h) => h.HorseID === Number(form.HorseID));
  const selectedGroom = grooms.find((g) => g.UserID === Number(form.GroomID));
  const selectedLock = selectedHorse ? locks.find((l) => l.HorseID === selectedHorse.HorseID) ?? null : null;
  const lockedByName = selectedLock ? users.find((u) => u.UserID === selectedLock.LockedBy)?.HoTen : undefined;
  // Chỉ nhân viên chăm sóc đang hoạt động; khi sửa vẫn giữ người đang phụ trách dù đã bị khóa
  const groomOptions = grooms
    .filter((g) => g.isActive || g.UserID === Number(form.GroomID))
    .sort((a, b) => a.HoTen.localeCompare(b.HoTen, "vi"));
  const groomDaySchedules =
    selectedGroom && form.Ngay
      ? schedules
          .filter((s) => s.GroomID === selectedGroom.UserID && s.Ngay === form.Ngay)
          .sort((a, b) => a.Gio.localeCompare(b.Gio))
      : [];
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  // Quay về lưới lịch tập đúng tuần chứa ngày của buổi tập
  const backToList = form.Ngay ? `/trainer/schedule?week=${startOfWeek(form.Ngay)}` : "/trainer/schedule";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Đổi ngày/giờ có thể hết trùng lịch → xóa lỗi trùng đang hiện ở ô ngựa/nhân viên
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      ...((name === "Ngay" || name === "Gio") && { HorseID: undefined, GroomID: undefined }),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.HorseID) newErrors.HorseID = "Vui lòng chọn ngựa";
    else if (selectedLock) newErrors.HorseID = "Ngựa đang bị khóa tập, không thể xếp lịch";
    if (!form.GroomID) newErrors.GroomID = "Vui lòng chọn nhân viên chăm sóc";
    if (!form.Ngay) newErrors.Ngay = "Vui lòng chọn ngày tập";
    else if (!isEdit && form.Ngay < today) newErrors.Ngay = "Ngày tập không được ở quá khứ";
    if (!form.Gio) newErrors.Gio = "Vui lòng chọn giờ tập";

    // Trùng giờ: cùng ngày + cùng giờ, bỏ qua chính buổi đang sửa
    if (form.Ngay && form.Gio) {
      const sameSlot = schedules.filter((s) => s.Ngay === form.Ngay && s.Gio === form.Gio && s.ScheduleID !== editingId);
      const slotText = `lúc ${form.Gio} ngày ${formatDate(form.Ngay)}`;
      if (!newErrors.GroomID && sameSlot.some((s) => s.GroomID === Number(form.GroomID)))
        newErrors.GroomID = `Nhân viên đã có lịch ${slotText}`;
      if (!newErrors.HorseID && sameSlot.some((s) => s.HorseID === Number(form.HorseID)))
        newErrors.HorseID = `Ngựa đã có lịch ${slotText}`;
    }
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
      if (isEdit) await updateSchedule(id, form);
      else await createSchedule(form);
      const horseName = selectedHorse?.Ten ?? "ngựa";
      navigate(backToList, {
        state: {
          message: isEdit
            ? `Đã cập nhật buổi tập của ${horseName} lúc ${form.Gio} ngày ${formatDate(form.Ngay)}.`
            : `Đã xếp lịch tập cho ${horseName} lúc ${form.Gio} ngày ${formatDate(form.Ngay)}.`,
        },
      });
    } catch (err) {
      setErrors({ form: err.message || "Không lưu được lịch tập, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelSchedule(id);
      navigate(backToList, {
        state: {
          message: `Đã hủy buổi tập của ${selectedHorse?.Ten ?? "ngựa"} lúc ${form.Gio} ngày ${formatDate(form.Ngay)}.`,
        },
      });
    } catch (err) {
      setErrors({ form: err.message || "Không hủy được lịch tập, vui lòng thử lại." });
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  if (loading) return <LoadingState />;

  if (blockedReason) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không thể sửa lịch tập</h1>
        <p className="mt-2 text-stone">{blockedReason}</p>
        <Link to="/trainer/schedule" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại lịch tập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại lịch tập
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa lịch tập" : "Xếp lịch tập"}
      </h1>

      {/* 2 cột giống form giáo án: form trái, ngữ cảnh phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border-t border-stone/20 pt-6">
          {errors.form && (
            <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
          )}

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <SelectField
              variant="outline"
              label="Ngựa"
              id="HorseID"
              name="HorseID"
              value={form.HorseID}
              onChange={handleChange}
              error={errors.HorseID}
            >
              <option value="">Chọn ngựa</option>
              {horses.map((horse) => (
                <option key={horse.HorseID} value={horse.HorseID}>
                  {horse.Ten} — {horse.Giong}
                  {locks.some((l) => l.HorseID === horse.HorseID) ? " (đang khóa tập)" : ""}
                </option>
              ))}
            </SelectField>
            <SelectField
              variant="outline"
              label="Nhân viên chăm sóc"
              id="GroomID"
              name="GroomID"
              value={form.GroomID}
              onChange={handleChange}
              error={errors.GroomID}
            >
              <option value="">Chọn nhân viên chăm sóc</option>
              {groomOptions.map((groom) => (
                <option key={groom.UserID} value={groom.UserID}>
                  {groom.HoTen}
                  {groom.isActive ? "" : " (đã khóa)"}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <FormField
              variant="outline"
              label="Ngày tập"
              id="Ngay"
              name="Ngay"
              type="date"
              min={isEdit ? undefined : today}
              value={form.Ngay}
              onChange={handleChange}
              error={errors.Ngay}
            />
            <FormField
              variant="outline"
              label="Giờ tập"
              id="Gio"
              name="Gio"
              type="time"
              step="900"
              value={form.Gio}
              onChange={handleChange}
              error={errors.Gio}
            />
          </div>

          {/* Hàng nút: Hủy lịch này (chữ, chỉ khi sửa) bên trái; Hủy + nút chính căn phải */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stone/20 pt-5">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="cursor-pointer text-sm font-medium text-stone underline-offset-2 hover:text-alert hover:underline"
              >
                Hủy lịch này
              </button>
            )}
            <div className="ml-auto flex items-center gap-5">
              <Link to={backToList} className="text-sm font-medium text-stone underline-offset-2 hover:text-ink hover:underline">
                Hủy
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer rounded-sm bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Xếp lịch"}
              </button>
            </div>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <ScheduleFormContext
            horse={selectedHorse}
            healthStatus={healthStatuses.find((h) => h.HorseID === selectedHorse?.HorseID)?.TrangThai}
            lock={selectedLock}
            lockedByName={lockedByName}
            groomName={selectedGroom?.HoTen}
            date={form.Ngay}
            groomDaySchedules={groomDaySchedules}
            horseById={horseById}
            editingScheduleId={editingId}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Hủy buổi tập"
        message={`Hủy buổi tập của ${selectedHorse?.Ten ?? "ngựa"} lúc ${form.Gio} ngày ${formatDate(form.Ngay)}? Thao tác này không thể hoàn tác.`}
        confirmLabel="Hủy buổi tập"
        cancelLabel="Giữ lại"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
