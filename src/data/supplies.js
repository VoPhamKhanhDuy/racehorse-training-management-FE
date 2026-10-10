// Mock data — khớp bảng SUPPLY trong ERD
// ManagedBy: UserID (số) của nhân sự phụ trách vật tư, tham chiếu bảng USER (xem utils/userId.js)
// DonGia: đơn giá 1 đơn vị (VNĐ) — dùng tính giá trị tồn kho ở trang Báo cáo
const supplies = [
  { SupplyID: 1, TenVatTu: "Cám ngựa đua", Loai: "Thức ăn", SoLuongTon: 120, ManagedBy: 3, DonGia: 450000 },
  { SupplyID: 2, TenVatTu: "Cỏ khô Timothy", Loai: "Thức ăn", SoLuongTon: 85, ManagedBy: 3, DonGia: 250000 },
  { SupplyID: 3, TenVatTu: "Yến mạch", Loai: "Thức ăn", SoLuongTon: 40, ManagedBy: 3, DonGia: 380000 },
  { SupplyID: 4, TenVatTu: "Vitamin tổng hợp", Loai: "Y tế", SoLuongTon: 25, ManagedBy: 2, DonGia: 650000 },
  { SupplyID: 5, TenVatTu: "Băng thun y tế", Loai: "Y tế", SoLuongTon: 60, ManagedBy: 2, DonGia: 45000 },
  { SupplyID: 6, TenVatTu: "Thuốc tẩy giun", Loai: "Y tế", SoLuongTon: 18, ManagedBy: 2, DonGia: 320000 },
  { SupplyID: 7, TenVatTu: "Yên cương", Loai: "Dụng cụ", SoLuongTon: 12, ManagedBy: 1, DonGia: 8500000 },
  { SupplyID: 8, TenVatTu: "Bàn chải lông", Loai: "Dụng cụ", SoLuongTon: 30, ManagedBy: 3, DonGia: 150000 },
  { SupplyID: 9, TenVatTu: "Móng sắt", Loai: "Dụng cụ", SoLuongTon: 48, ManagedBy: 1, DonGia: 220000 },
];

export default supplies;
