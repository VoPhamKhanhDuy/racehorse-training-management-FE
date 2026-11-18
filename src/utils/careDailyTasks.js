// Việc chăm sóc hằng ngày của nhân viên chăm sóc, TỰ SINH từ chuồng + khẩu phần theo bữa (không phụ thuộc kế hoạch huấn luyện, không bị
// chặn bởi việc duyệt kế hoạch). Giờ là giờ chuẩn do FE đặt (BE chưa có trường giờ cho việc chăm sóc hằng ngày).
// TODO(BE): GET /api/groom/care-tasks?date trả danh sách việc trong ngày (key, giờ, ngựa, công việc, khẩu phần, đã xong lúc nào, ghi chú).
export const DAILY_CARE = [
  { code: "feedMorning", label: "Cho ăn sáng", time: "06:30", meal: "sáng" },
  { code: "clean", label: "Dọn chuồng và thay nước", time: "07:00" },
  { code: "feedNoon", label: "Cho ăn chiều", time: "12:00", meal: "chiều" },
  { code: "grooming", label: "Chải lông và kiểm tra móng", time: "16:00" },
  { code: "feedEvening", label: "Cho ăn tối", time: "17:30", meal: "tối" },
];

// Khẩu phần 1 bữa → "Cỏ 4 kg · Ngũ cốc 2 kg" (bỏ thành phần bằng 0)
export function rationText(plan) {
  return [
    plan.Co > 0 ? `Cỏ ${plan.Co} kg` : null,
    plan.NguCoc > 0 ? `Ngũ cốc ${plan.NguCoc} kg` : null,
    plan.Vitamin > 0 ? `Vitamin ${plan.Vitamin}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export const careTaskKey = (date, horseId, code) => `${date}|${horseId}|${code}`;

// horses: [{ HorseID, Ten, SoChuong }] — ngựa trong các chuồng Groom phụ trách; feedingPlans: bản ghi khẩu phần (HorseID, Bua, Co, NguCoc, Vitamin).
// Bữa ăn nào ngựa không có khẩu phần thì KHÔNG sinh việc cho ăn bữa đó.
export function generateDailyCareTasks({ date, horses, feedingPlans }) {
  const tasks = [];
  horses.forEach((horse) => {
    DAILY_CARE.forEach((item) => {
      let detail = "";
      if (item.meal) {
        const plan = feedingPlans.find((p) => Number(p.HorseID) === Number(horse.HorseID) && (p.Bua ?? "").toLowerCase().includes(item.meal));
        detail = plan ? rationText(plan) : "";
        if (!detail) return;
      }
      tasks.push({
        key: careTaskKey(date, horse.HorseID, item.code),
        horseId: horse.HorseID,
        horseName: horse.Ten,
        stable: horse.SoChuong ?? "",
        label: item.label,
        detail,
        time: item.time,
      });
    });
  });
  return tasks.sort((a, b) => a.time.localeCompare(b.time) || a.stable.localeCompare(b.stable) || a.horseName.localeCompare(b.horseName, "vi"));
}
