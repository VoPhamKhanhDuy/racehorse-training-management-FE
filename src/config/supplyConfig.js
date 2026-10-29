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

export const getSupplyConfig = (tenVatTu) => SUPPLY_CONFIG[tenVatTu] ?? DEFAULT_CONFIG;

// Tình trạng tồn kho: "Hết hàng" (= 0) | "Sắp hết" (≤ ngưỡng) | "Đủ"
export const SUPPLY_STATES = { OUT: "Hết hàng", LOW: "Sắp hết", OK: "Đủ" };

export function getSupplyState(item) {
  if (item.SoLuongTon <= 0) return SUPPLY_STATES.OUT;
  if (item.SoLuongTon <= getSupplyConfig(item.TenVatTu).nguongSapHet) return SUPPLY_STATES.LOW;
  return SUPPLY_STATES.OK;
}
