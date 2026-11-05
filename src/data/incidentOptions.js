// Lựa chọn cho form "Gửi báo cáo sự cố" (INCIDENTREPORT.LoaiSuCo) + giới hạn ảnh đính kèm (HinhAnh)
export const INCIDENT_TYPES = ["Vết thương", "Khập khiễng", "Bỏ ăn", "Chuồng/thiết bị hỏng", "Khác"];

// Các loại sự cố liên quan sức khỏe ngựa (pill tông cam để nổi hơn loại về chuồng/thiết bị)
export const HEALTH_INCIDENT_TYPES = ["Vết thương", "Khập khiễng", "Bỏ ăn"];

// Sự cố chuồng trại / thiết bị — Club Manager xử lý, không hiện cho bác sĩ thú y
export const FACILITY_INCIDENT_TYPES = ["Chuồng/thiết bị hỏng"];

// Mô tả (MoTa): không bắt buộc, tối đa 300 ký tự
export const INCIDENT_DESCRIPTION_MAX = 300;

// Ghi chú xử lý (GhiChuXuLy) khi hoàn tất: bắt buộc, tối đa 500 ký tự
export const INCIDENT_HANDLE_NOTE_MAX = 500;

// Ảnh: chỉ jpg/png, tối đa 5MB
export const INCIDENT_IMAGE = {
  accept: "image/jpeg,image/png",
  types: ["image/jpeg", "image/png"],
  maxBytes: 5 * 1024 * 1024,
  maxLabel: "5MB",
};

// Trạng thái xử lý sự cố (INCIDENTREPORT.TrangThai). Bản ghi cũ chưa có trường này coi như "Mới".
export const INCIDENT_STATUS = { NEW: "Mới", IN_PROGRESS: "Đang xử lý", DONE: "Đã xử lý" };
export const INCIDENT_STATUSES = Object.values(INCIDENT_STATUS);
