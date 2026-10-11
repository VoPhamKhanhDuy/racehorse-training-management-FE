// Lựa chọn cho form "Gửi báo cáo sự cố" (INCIDENTREPORT.LoaiSuCo) + giới hạn ảnh đính kèm (HinhAnh)
export const INCIDENT_TYPES = ["Vết thương", "Khập khiễng", "Bỏ ăn", "Chuồng/thiết bị hỏng", "Khác"];

// Các loại sự cố liên quan sức khỏe ngựa (pill tông cam để nổi hơn loại về chuồng/thiết bị)
export const HEALTH_INCIDENT_TYPES = ["Vết thương", "Khập khiễng", "Bỏ ăn"];

// Mô tả (MoTa): không bắt buộc, tối đa 300 ký tự
export const INCIDENT_DESCRIPTION_MAX = 300;

// Ảnh: chỉ jpg/png, tối đa 5MB
export const INCIDENT_IMAGE = {
  accept: "image/jpeg,image/png",
  types: ["image/jpeg", "image/png"],
  maxBytes: 5 * 1024 * 1024,
  maxLabel: "5MB",
};
