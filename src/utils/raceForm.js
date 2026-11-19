import { addDays } from "./date";

// Form "Tạo giải" của quản lý CLB. Luật kiểm tra giống BE (RaceService.ValidateNewRace); BE vẫn kiểm tra lại khi lưu.
export const RACE_NAME_MAX = 150;
export const RACE_LOCATION_MAX = 255;
export const RACE_DESCRIPTION_MAX = 1000;
export const RACE_MAX_PARTICIPANTS_LIMIT = 50;

export const EMPTY_RACE_FORM = {
  name: "",
  location: "",
  raceDate: "",
  deadline: "",
  distance: "",
  maxParticipants: "",
  entryFee: "",
  prizeFirst: "",
  prizeSecond: "",
  prizeThird: "",
  prizePool: "",
  description: "",
};

const RANK_FIELDS = [
  { key: "prizeFirst", label: "Giải Nhất" },
  { key: "prizeSecond", label: "Giải Nhì" },
  { key: "prizeThird", label: "Giải Ba" },
];

export const hasRankPrize = (form) => RANK_FIELDS.some(({ key }) => form[key] !== "");

// Có nhập ít nhất một hạng thì tổng = Nhất + Nhì + Ba (ô tổng chỉ đọc); không thì dùng tổng nhập tay
export const prizeTotal = (form) =>
  hasRankPrize(form) ? RANK_FIELDS.reduce((sum, { key }) => sum + Number(form[key] || 0), 0) : Number(form.prizePool || 0);

// Ngày đua phải sau hôm nay; hạn đăng ký từ hôm nay đến ngày đua (dùng cho min / max của ô chọn ngày)
export const raceDateMin = (today) => addDays(today, 1);

export function validateRaceForm(form, today) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Vui lòng nhập tên giải";
  else if (name.length > RACE_NAME_MAX) errors.name = `Tên giải tối đa ${RACE_NAME_MAX} ký tự`;
  if (form.location.trim().length > RACE_LOCATION_MAX) errors.location = `Địa điểm tối đa ${RACE_LOCATION_MAX} ký tự`;

  if (!form.raceDate) errors.raceDate = "Vui lòng chọn ngày đua";
  else if (form.raceDate <= today) errors.raceDate = "Ngày đua phải sau hôm nay";

  if (!form.deadline) errors.deadline = "Vui lòng chọn hạn đăng ký";
  else if (form.deadline < today) errors.deadline = "Hạn đăng ký không được ở quá khứ";
  else if (form.raceDate && form.deadline > form.raceDate) errors.deadline = "Hạn đăng ký không được sau ngày đua";

  if (!(Number(form.distance) > 0)) errors.distance = "Cự ly phải lớn hơn 0";
  const max = Number(form.maxParticipants);
  if (!Number.isInteger(max) || max < 1 || max > RACE_MAX_PARTICIPANTS_LIMIT) {
    errors.maxParticipants = `Số ngựa tối đa từ 1 đến ${RACE_MAX_PARTICIPANTS_LIMIT}`;
  }
  // Ô tiền chỉ nhận chữ số nên luôn >= 0; các hạng đã nhập phải giảm dần: Nhất >= Nhì >= Ba
  const entered = RANK_FIELDS.filter(({ key }) => form[key] !== "");
  entered.forEach((rank, i) => {
    const previous = entered[i - 1];
    if (previous && Number(form[rank.key]) > Number(form[previous.key])) {
      errors[rank.key] = `${rank.label} không được lớn hơn ${previous.label}`;
    }
  });
  if (form.description.trim().length > RACE_DESCRIPTION_MAX) {
    errors.description = `Mô tả tối đa ${RACE_DESCRIPTION_MAX} ký tự`;
  }
  return errors;
}

// Form → body POST /api/races
export const toRaceRequest = (form) => ({
  tenGiai: form.name.trim(),
  diaDiem: form.location.trim() || null,
  ngay: form.raceDate,
  registrationDeadline: form.deadline,
  distanceMeters: Number(form.distance),
  maxParticipants: Number(form.maxParticipants),
  entryFee: Number(form.entryFee || 0),
  prizeFirst: form.prizeFirst === "" ? null : Number(form.prizeFirst),
  prizeSecond: form.prizeSecond === "" ? null : Number(form.prizeSecond),
  prizeThird: form.prizeThird === "" ? null : Number(form.prizeThird),
  // BE tự tính lại tổng khi có nhập hạng; chỉ gửi tổng nhập tay khi không nhập hạng nào
  prizePool: hasRankPrize(form) || form.prizePool === "" ? null : Number(form.prizePool),
  description: form.description.trim() || null,
});
