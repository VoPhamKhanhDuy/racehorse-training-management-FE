// Mock data — bảng FEEDINGPLAN (khẩu phần ăn) trong ERD: FeedID, HorseID, NguCoc, Co, Vitamin, Bua
// Bua ∈ "Sáng" | "Chiều" | "Tối". NguCoc (kg), Co (kg), Vitamin (g) — ĐƠN VỊ GIẢ ĐỊNH, xác nhận lại với BE
// (đơn vị hiển thị ở data/feedingOptions.js). Mỗi ngựa 2–3 bữa; giá trị 0 = bữa đó không có thành phần này.
const feedingPlans = [
  // Thunder
  { FeedID: 1, HorseID: 1, NguCoc: 2.5, Co: 3, Vitamin: 20, Bua: "Sáng" },
  { FeedID: 2, HorseID: 1, NguCoc: 2, Co: 4, Vitamin: 0, Bua: "Chiều" },
  { FeedID: 3, HorseID: 1, NguCoc: 0, Co: 5, Vitamin: 10, Bua: "Tối" },
  // Lightning
  { FeedID: 4, HorseID: 2, NguCoc: 3, Co: 3, Vitamin: 25, Bua: "Sáng" },
  { FeedID: 5, HorseID: 2, NguCoc: 2.5, Co: 4, Vitamin: 0, Bua: "Chiều" },
  { FeedID: 6, HorseID: 2, NguCoc: 0, Co: 5, Vitamin: 15, Bua: "Tối" },
  // Storm — đang nghỉ nên giảm ngũ cốc
  { FeedID: 7, HorseID: 3, NguCoc: 1.5, Co: 4, Vitamin: 20, Bua: "Sáng" },
  { FeedID: 8, HorseID: 3, NguCoc: 1, Co: 5, Vitamin: 0, Bua: "Chiều" },
  // Blaze
  { FeedID: 9, HorseID: 4, NguCoc: 3, Co: 3.5, Vitamin: 20, Bua: "Sáng" },
  { FeedID: 10, HorseID: 4, NguCoc: 2.5, Co: 4, Vitamin: 0, Bua: "Chiều" },
  { FeedID: 11, HorseID: 4, NguCoc: 0, Co: 5, Vitamin: 10, Bua: "Tối" },
  // Shadow
  { FeedID: 12, HorseID: 5, NguCoc: 2.5, Co: 3, Vitamin: 15, Bua: "Sáng" },
  { FeedID: 13, HorseID: 5, NguCoc: 2, Co: 4, Vitamin: 0, Bua: "Chiều" },
  // Spirit
  { FeedID: 14, HorseID: 6, NguCoc: 2, Co: 3, Vitamin: 20, Bua: "Sáng" },
  { FeedID: 15, HorseID: 6, NguCoc: 2, Co: 4, Vitamin: 10, Bua: "Chiều" },
  { FeedID: 16, HorseID: 6, NguCoc: 0, Co: 4.5, Vitamin: 0, Bua: "Tối" },
];

export default feedingPlans;
