// DỮ LIỆU MẪU — chờ BE bổ sung cột tương ứng cho bảng Race (MoTa, HangMuc, CuLy, DieuKienNgua, TongGiaiThuong, CoCauGiaiThuong,
// LePhi, HanDangKy, LichTrinh). Hiện BE chỉ có tên giải, ngày, địa điểm. Nội dung dưới đây do FE tự viết để dựng giao diện
// "Thông tin giải", KHÔNG phải thông tin thật và không nhắc tới tổ chức hay địa chỉ ngoài đời. Giải nào không khớp thì modal chỉ hiện
// phần có thật (tên, ngày, địa điểm) và dòng "Chưa có mô tả chi tiết".
// Khớp theo mã giải (RaceID) HOẶC từ khóa trong tên giải (không phân biệt hoa thường) vì mã giải của BE và mock cũ khác nhau.
// Lệ phí không đặt ở đây: lệ phí mẫu lấy từ raceRegistrationApi.sampleEntryFee để các màn khác dùng cùng một số.
// Cơ cấu giải thưởng MẪU dùng để điền sẵn tiền thưởng khi giải chưa có dữ liệu mẫu riêng (hạng 1 / 2 / 3)
export const DEFAULT_SAMPLE_PAYOUTS = [50000000, 30000000, 20000000];

const RACE_INFO = [
  {
    keywords: ["autumn sprint"],
    description:
      "Cuộc đua nước rút mùa thu trên đường thẳng ngắn, ưu tiên ngựa có tốc độ bứt phá tốt. Thích hợp để đánh giá phong độ sau giai đoạn tập nền.",
    category: "Đua nước rút",
    distance: "1.000 m",
    eligibility: "Ngựa từ 3 tuổi trở lên, giống Thoroughbred",
    prizePool: 100000000,
    payouts: [50000000, 30000000, 20000000],
    schedule: [
      { time: "06:30", label: "Điểm danh ngựa và nài" },
      { time: "07:30", label: "Kiểm tra trước đua" },
      { time: "09:00", label: "Xuất phát" },
    ],
  },
  {
    keywords: ["young horse trial"],
    description:
      "Cuộc đua thử sức dành cho ngựa non, giúp huấn luyện viên đánh giá phong độ và tính ổn định của ngựa trước các giải lớn trong mùa. Ưu tiên ngựa mới thi đấu lần đầu.",
    category: "Đua thử sức ngựa non",
    distance: "1.200 m",
    eligibility: "Ngựa từ 2 đến 3 tuổi, giống Thoroughbred, chưa từng đạt hạng nhất ở giải chính thức",
    prizePool: 120000000,
    payouts: [60000000, 36000000, 24000000],
    schedule: [
      { time: "06:30", label: "Điểm danh ngựa và nài" },
      { time: "07:15", label: "Kiểm tra trước đua" },
      { time: "08:30", label: "Vòng thử đường chạy" },
      { time: "09:30", label: "Xuất phát" },
    ],
  },
  {
    ids: [1],
    keywords: ["mùa thu"],
    description:
      "Giải đua thường niên đầu mùa thu, quy tụ ngựa của nhiều câu lạc bộ. Phù hợp để ngựa đã qua giai đoạn nền tảng thể lực thử sức ở cự ly trung bình.",
    category: "Đua cự ly trung bình",
    distance: "1.600 m",
    eligibility: "Ngựa từ 3 tuổi trở lên, giống Thoroughbred hoặc lai",
    prizePool: 200000000,
    payouts: [100000000, 60000000, 40000000],
    schedule: [
      { time: "06:00", label: "Điểm danh ngựa và nài" },
      { time: "07:00", label: "Kiểm tra trước đua" },
      { time: "09:00", label: "Vòng loại" },
      { time: "10:30", label: "Xuất phát vòng chung kết" },
    ],
  },
  {
    ids: [2],
    keywords: ["thành phố"],
    description:
      "Cúp đua cấp thành phố dành cho ngựa nội địa, mỗi ngựa thi đấu một lượt duy nhất. Thể thức gọn, phù hợp ngựa cần tích lũy kinh nghiệm thi đấu.",
    category: "Đua một lượt",
    distance: "1.400 m",
    eligibility: "Ngựa từ 3 đến 6 tuổi, không giới hạn giống",
    prizePool: 150000000,
    payouts: [75000000, 45000000, 30000000],
    schedule: [
      { time: "06:30", label: "Điểm danh ngựa và nài" },
      { time: "07:30", label: "Kiểm tra trước đua" },
      { time: "09:00", label: "Xuất phát" },
    ],
  },
];

const normalize = (text) => (text ?? "").toLowerCase();

// Thông tin mô tả mẫu của 1 giải (race: { RaceID, TenGiai }) hoặc null nếu chưa có
export function getRaceInfo(race) {
  const name = normalize(race.TenGiai);
  return (
    RACE_INFO.find((info) => (info.ids ?? []).includes(Number(race.RaceID)) || info.keywords.some((keyword) => name.includes(keyword))) ?? null
  );
}
