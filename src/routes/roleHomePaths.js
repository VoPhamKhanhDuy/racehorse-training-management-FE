// Trang chủ của từng role — dùng để điều hướng sau khi đăng nhập
// và khi user vào nhầm khu vực của role khác
const roleHomePaths = {
  head_trainer: "/trainer",
  veterinarian: "/vet",
  groom: "/groom",
  horse_owner: "/owner",
  club_manager: "/manager",
};

export default roleHomePaths;
