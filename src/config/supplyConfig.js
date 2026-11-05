// Đơn vị tính + ngưỡng "Sắp hết" của từng vật tư, tra theo TenVatTu — dùng cho trang Vật tư của nhân viên chăm sóc.
// LƯU Ý: ERD SUPPLY hiện CHƯA có trường đơn vị và ngưỡng, nên tạm đặt trong cấu hình này — xác nhận lại với BE
// (nếu BE thêm trường vào SUPPLY thì đọc từ bản ghi, bỏ map này).
export const SUPPLY_CONFIG = {
  "Cám ngựa đua": { donVi: "kg", nguongSapHet: 100 },
  "Cỏ khô Timothy": { donVi: "kg", nguongSapHet: 200 },
  "Yến mạch": { donVi: "kg", nguongSapHet: 100 },
  "Vitamin tổng hợp": { donVi: "hộp", nguongSapHet: 5 },
  "Băng thun y tế": { donVi: "cuộn", nguongSapHet: 10 },
  "Thuốc tẩy giun": { donVi: "liều", nguongSapHet: 20 },
  "Yên cương": { donVi: "bộ", nguongSapHet: 5 },
  "Bàn chải lông": { donVi: "cái", nguongSapHet: 10 },
  "Móng sắt": { donVi: "bộ", nguongSapHet: 20 },
};

// Vật tư không có trong map
const DEFAULT_CONFIG = { donVi: "", nguongSapHet: 10 };

export const getSupplyConfig = (tenVatTu) => SUPPLY_CONFIG[tenVatTu] ?? SUPPLY_CONFIG[NAME_LABELS[tenVatTu]] ?? DEFAULT_CONFIG;

// Tình trạng tồn kho: "Hết hàng" (= 0) | "Sắp hết" (≤ ngưỡng) | "Đủ"
export const SUPPLY_STATES = { OUT: "Hết hàng", LOW: "Sắp hết", OK: "Đủ" };

export function getSupplyState(item) {
  if (item.SoLuongTon <= 0) return SUPPLY_STATES.OUT;
  if (item.SoLuongTon <= supplyMinimum(item)) return SUPPLY_STATES.LOW;
  return SUPPLY_STATES.OK;
}

// ---- Việt hóa hiển thị (chỉ để hiển thị; dữ liệu thật trong DB vẫn tiếng Anh — cần sửa DB / BE trả tiếng Việt) ----
// TODO(BE/DB): đổi tên, nhóm, đơn vị vật tư sang tiếng Việt trong dữ liệu rồi bỏ các map dưới đây.
const TYPE_LABELS = {
  Feed: "Thức ăn",
  Medical: "Y tế",
  "Stable Equipment": "Dụng cụ chuồng",
  Cleaning: "Vệ sinh",
  Supplement: "Bổ sung dinh dưỡng",
  Grooming: "Chải chuốt",
};
const UNIT_LABELS = { piece: "cái", roll: "cuộn", bottle: "chai", pack: "gói", kit: "bộ", kg: "kg", box: "hộp", set: "bộ" };
const NAME_LABELS = {
  "First Aid Kit": "Bộ sơ cứu",
  "Water Bucket": "Xô nước",
  "Bandage Roll": "Cuộn băng",
  "Performance Pellets": "Cám viên hiệu suất",
  "Quality Hay": "Cỏ khô chất lượng",
  Disinfectant: "Chất khử trùng",
  "Electrolyte Supplement": "Điện giải bổ sung",
  "Grooming Brush": "Bàn chải lông",
  "Hoof Pick": "Cây lấy móng",
};
// Mức tối thiểu mẫu cho vật tư tên tiếng Anh (tra theo tên hiển thị tiếng Việt)
Object.assign(SUPPLY_CONFIG, {
  "Bộ sơ cứu": { donVi: "bộ", nguongSapHet: 10 },
  "Xô nước": { donVi: "cái", nguongSapHet: 15 },
  "Cuộn băng": { donVi: "cuộn", nguongSapHet: 20 },
  "Cám viên hiệu suất": { donVi: "kg", nguongSapHet: 50 },
  "Cỏ khô chất lượng": { donVi: "kg", nguongSapHet: 100 },
  "Chất khử trùng": { donVi: "chai", nguongSapHet: 5 },
  "Điện giải bổ sung": { donVi: "gói", nguongSapHet: 10 },
  "Cây lấy móng": { donVi: "cái", nguongSapHet: 5 },
});

export const supplyDisplayName = (item) => NAME_LABELS[item.TenVatTu] ?? item.TenVatTu;
export const supplyDisplayType = (loai) => TYPE_LABELS[loai] ?? loai;
export const supplyUnit = (item) => {
  const raw = item.DonVi || getSupplyConfig(supplyDisplayName(item)).donVi;
  return UNIT_LABELS[raw] ?? raw;
};
// Mức tối thiểu: lấy từ dữ liệu BE nếu có (MucToiThieu), không thì dùng giá trị mẫu ở trên
export const supplyMinimum = (item) => item.MucToiThieu ?? getSupplyConfig(supplyDisplayName(item)).nguongSapHet;
