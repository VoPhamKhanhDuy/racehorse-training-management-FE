# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG VÀ ĐẶC TẢ HỆ THỐNG EQUITRACK
**Hệ thống Quản lý Huấn luyện, Chăm sóc Sức khỏe & Thi đấu Ngựa Đua Chuyên nghiệp**  
*(Racehorse Training, Health & Stable Management System)*

---

## MỤC LỤC CHI TIẾT
- [CHƯƠNG 1: TỔNG QUAN HỆ THỐNG VÀ KIẾN TRÚC KỸ THUẬT](#chương-1-tổng-quan-hệ-thống-và-kiến-trúc-kỹ-thuật)
  - [1.1. Mục tiêu và phạm vi nghiệp vụ](#11-mục-tiêu-và-phạm-vi-nghiệp-vụ)
  - [1.2. Ngăn xếp công nghệ (Technology Stack)](#12-ngăn-xếp-công-nghệ-technology-stack)
  - [1.3. Mô hình phân quyền người dùng (RBAC)](#13-mô-hình-phân-quyền-người-dùng-rbac)
  - [1.4. Cơ chế đồng bộ dữ liệu thời gian thực (SignalR Realtime)](#14-cơ-chế-đồng-bộ-dữ-liệu-thời-gian-thực-signalr-realtime)
- [CHƯƠNG 2: THÔNG TIN TÀI KHOẢN VÀ HƯỚNG DẪN CÀI ĐẶT](#chương-2-thông-tin-tài-khoản-và-hướng-dẫn-cài-đặt)
  - [2.1. Danh sách tài khoản thử nghiệm chuẩn](#21-danh-sách-tài-khoản-thử-nghiệm-chuẩn)
  - [2.2. Yêu cầu môi trường vận hành](#22-yêu-cầu-môi-trường-vận-hành)
  - [2.3. Hướng dẫn khởi chạy Backend API (.NET 8)](#23-hướng-dẫn-khởi-chạy-backend-api-net-8)
  - [2.4. Hướng dẫn khởi chạy Frontend Web App (React + Vite)](#24-hướng-dẫn-khởi-chạy-frontend-web-app-react--vite)
- [CHƯƠNG 3: ĐẶC TẢ CƠ SỞ DỮ LIỆU (DATABASE DICTIONARY)](#chương-3-đặc-tả-cơ-sở-dữ-liệu-database-dictionary)
  - [3.1. Nhóm bảng Người dùng & Phân quyền](#31-nhóm-bảng-người-dùng--phân-quyền)
  - [3.2. Nhóm bảng Hồ sơ Ngựa & Thể trạng](#32-nhóm-bảng-hồ-sơ-ngựa--thể-trạng)
  - [3.3. Nhóm bảng Y tế & Lệnh khóa huấn luyện](#33-nhóm-bảng-y-tế--lệnh-khóa-huấn-luyện)
  - [3.4. Nhóm bảng Kế hoạch Huấn luyện & Buổi tập](#34-nhóm-bảng-kế-hoạch-huấn-luyện--buổi-tập)
  - [3.5. Nhóm bảng Chuồng trại, Sự cố & Dinh dưỡng](#35-nhóm-bảng-chuồng-trại-sự-cố--dinh-dưỡng)
  - [3.6. Nhóm bảng Giải đua & Phê duyệt thi đấu](#36-nhóm-bảng-giải-đua--phê-duyệt-thi-đấu)
  - [3.7. Nhóm bảng Vật tư & Nhật ký hệ thống (Audit Log)](#37-nhóm-bảng-vật-tư--nhật-ký-hệ-thống-audit-log)
- [CHƯƠNG 4: DANH MỤC ENDPOINTS BACKEND API](#chương-4-danh-mục-endpoints-backend-api)
  - [4.1. Xác thực & Tài khoản (Auth & Accounts)](#41-xác-thực--tài-khoản-auth--accounts)
  - [4.2. Hồ sơ Ngựa (Horses Management)](#42-hồ-sơ-ngựa-horses-management)
  - [4.3. Quản lý CLB (Club Manager Endpoints)](#43-quản-lý-clb-club-manager-endpoints)
  - [4.4. Huấn luyện viên trưởng (Trainer Endpoints)](#44-huấn-luyện-viên-trưởng-trainer-endpoints)
  - [4.5. Bác sĩ thú y (Veterinarian Endpoints)](#45-bác-sĩ-thú-y-veterinarian-endpoints)
  - [4.6. Chăm sóc & Chuồng trại (Groom Endpoints)](#46-chăm-sóc--chuồng-trại-groom-endpoints)
  - [4.7. Giải đua & Quy trình Phê duyệt (Races & Approvals)](#47-giải-đua--quy-trình-phê-duyệt-races--approvals)
- [CHƯƠNG 5: HƯỚNG DẪN THAO TÁC CHI TIẾT TỪNG MÀN HÌNH (5 VAI TRÒ)](#chương-5-hướng-dẫn-thao-tác-chi-tiết-từng-màn-hình-5-vai-trò)
  - [5.1. Phân hệ Quản lý CLB (Club Manager)](#51-phân-hệ-quản-lý-clb-club-manager)
  - [5.2. Phân hệ Huấn luyện viên trưởng (Head Trainer)](#52-phân-hệ-huấn-luyện-viên-trưởng-head-trainer)
  - [5.3. Phân hệ Bác sĩ thú y (Veterinarian)](#53-phân-hệ-bác-sĩ-thú-y-veterinarian)
  - [5.4. Phân hệ Nhân viên chăm sóc / Nài ngựa (Groom)](#54-phân-hệ-nhân-viên-chăm-sóc--nài-ngựa-groom)
  - [5.5. Phân hệ Chủ ngựa (Horse Owner)](#55-phân-hệ-chủ-ngựa-horse-owner)
  - [5.6. Phân hệ Xác thực & Trang công khai (Auth & Public)](#56-phân-hệ-xác-thực--trang-công-khai-auth--public)
- [CHƯƠNG 6: CÁC KỊCH BẢN KIỂM THỬ LIÊN THÔNG (END-TO-END FLOWS)](#chương-6-các-kịch-bản-kiểm-thử-liên-thông-end-to-end-flows)
  - [Kịch bản 1: Đăng ký tài khoản Chủ ngựa & Khởi tạo chiến mã](#kịch-bản-1-đăng-ký-tài-khoản-chủ-ngựa--khởi-tạo-chiến-mã)
  - [Kịch bản 2: Vòng đời Giáo án huấn luyện (Trainer - Owner - Groom)](#kịch-bản-2-vòng-đời-giáo-án-huấn-luyện-trainer---owner---groom)
  - [Kịch bản 3: Xử lý Y tế & Ràng buộc an toàn chéo (Vet - Trainer)](#kịch-bản-3-xử-lý-y-tế--ràng-buộc-an-toàn-chéo-vet---trainer)
  - [Kịch bản 4: Xử lý Sự cố chuồng trại khẩn cấp (Groom - Vet - Manager)](#kịch-bản-4-xử-lý-sự-cố-chuồng-trại-khẩn-cấp-groom---vet---manager)
  - [Kịch bản 5: Quy trình Đăng ký thi đấu 3 cấp độ & Ghi nhận thành tích](#kịch-bản-5-quy-trình-đăng-ký-thi-đấu-3-cấp-độ--ghi-nhận-thành-tích)
- [CHƯƠNG 7: QUY CHUẨN THIẾT KẾ GIAO DIỆN & HỆ THỐNG THÀNH PHẦN (UI DESIGN SYSTEM)](#chương-7-quy-chuẩn-thiết-kế-giao-diện--hệ-thống-thành-phần-ui-design-system)
  - [7.1. Bảng màu chuẩn phong cách Equestrian Club](#71-bảng-màu-chuẩn-phong-cách-equestrian-club)
  - [7.2. Quy tắc Typography và Tiêu đề](#72-quy-tắc-typography-và-tiêu-đề)
  - [7.3. Cấu trúc lưới Layout 5 tầng](#73-cấu-trúc-lưới-layout-5-tầng)
  - [7.4. Danh mục Component dùng chung (Shared Components)](#74-danh-mục-component-dùng-chung-shared-components)
- [CHƯƠNG 8: XỬ LÝ SỰ CỐ VÀ CÂU HỎI THƯỜNG GẶP (TROUBLESHOOTING & FAQ)](#chương-8-xử-lý-sự-cố-và-câu-hỏi-thường-gặp-troubleshooting--faq)
- [PHỤ LỤC A: ĐẶC TẢ DTO VÀ CẤU TRÚC JSON PAYLOAD CỦA CÁC API CỐT LÕI](#phụ-lục-a-đặc-tả-dto-và-cấu-trúc-json-payload-của-các-api-cốt-lõi)
- [PHỤ LỤC B: MA TRẬN PHÂN QUYỀN CRUD CHI TIẾT (RBAC MATRIX)](#phụ-lục-b-ma-trận-phân-quyền-crud-chi-tiết-rbac-matrix)
- [PHỤ LỤC C: CẤU TRÚC TỔ CHỨC THƯ MỤC DỰ ÁN (PROJECT REPOSITORY TREE)](#phụ-lục-c-cấu-trúc-tổ-chức-thư-mục-dự-án-project-repository-tree)
- [PHỤ LỤC D: CHECKLIST TỰ KIỂM TRA TRƯỚC KHI BẢO VỆ ĐỒ ÁN (DEFENSE READINESS CHECKLIST)](#phụ-lục-d-checklist-tự-kiểm-tra-trước-khi-bảo-vệ-đồ-án-defense-readiness-checklist)

---

# CHƯƠNG 1: TỔNG QUAN HỆ THỐNG VÀ KIẾN TRÚC KỸ THUẬT

## 1.1. Mục tiêu và phạm vi nghiệp vụ
Hệ thống **EquiTrack** là nền tảng quản trị tổng thể cho các câu lạc bộ, trang trại và trung tâm huấn luyện ngựa đua chuyên nghiệp. Hệ thống được xây dựng nhằm mục đích:
1. **Số hóa toàn diện hồ sơ chiến mã:** Lý lịch phả hệ, thể trạng, vị trí chuồng trại, chỉ số nhân trắc học và hình ảnh chuẩn độ phân giải cao.
2. **Quy trình hóa công tác huấn luyện:** Thiết lập giáo án có phê duyệt từ chủ sở hữu, phân rã bài tập tuần, giao việc cho nài ngựa và đánh giá phản hồi định kỳ.
3. **Kiểm soát an toàn y tế và sinh học:** Quản lý bệnh án điện tử, phân bổ lịch tiêm phòng và cơ chế khóa tập tự động ngăn ngừa việc ép tập ngựa chấn thương.
4. **Vận hành chuồng trại và vật tư:** Phân bổ khẩu phần dinh dưỡng, quản lý tồn kho thức ăn/thuốc men và xử lý nhanh sự cố cơ sở vật chất.
5. **Minh bạch hóa quản lý và tài chính:** Chu trình đăng ký thi đấu 3 cấp độ (HLV đề xuất $\rightarrow$ Chủ ngựa đồng ý $\rightarrow$ Quản lý CLB chốt), theo dõi chi phí chuồng trại và nhật ký kiểm toán hệ thống.

## 1.2. Ngăn xếp công nghệ (Technology Stack)
* **Backend:**
  - Nền tảng: ASP.NET Core 8.0 Web API (.NET 8).
  - Kiến trúc: Clean Architecture / N-Tier Architecture (API, Core/Domain, Infrastructure, Application).
  - ORM: Entity Framework Core 8.0 kết hợp LINQ.
  - Cơ chế Realtime: Microsoft SignalR Hub (`/horseHub`).
  - Xác thực: JSON Web Token (JWT) Bearer Authentication.
  - Lưu trữ đám mây: Cloudinary .NET SDK (quản lý ảnh ngựa và hình ảnh hiện trường sự cố).
* **Frontend:**
  - Nền tảng: React 18, Vite 8 (Hot Module Replacement, tối ưu hóa bundle qua Oxc / Rolldown).
  - Định tuyến: React Router DOM v6 với cơ chế Bảo vệ tuyến đường (`ProtectedRoute`).
  - Giao diện: Tailwind CSS v4, Lucide React Icons.
  - Xử lý API & Realtime: Axios Client (kèm interceptor tự động gán Bearer Token) & `@microsoft/signalr`.
* **Cơ sở dữ liệu:**
  - Hệ quản trị: Microsoft SQL Server 2019 / 2022.
  - Bảng mã: Unicode UTF-8 (`NVARCHAR`) hỗ trợ toàn diện tiếng Việt có dấu.

## 1.3. Mô hình phân quyền người dùng (RBAC)
Hệ thống thiết lập 5 vai trò người dùng độc lập với phạm vi thẩm quyền rõ ràng:
1. **Club Manager (`club_manager`):** Toàn quyền quản trị cơ sở, duyệt tài khoản, nhân sự, vật tư, duyệt thi đấu cấp cao nhất và xem nhật ký thao tác.
2. **Head Trainer (`head_trainer`):** Thiết kế giáo án, giao việc buổi tập cho nài ngựa, đánh giá thể lực và đề xuất chiến mã tham gia thi đấu.
3. **Veterinarian (`veterinarian`):** Quản lý bệnh án, tiêm phòng, ban hành Lệnh khóa huấn luyện và tiếp nhận sự cố y tế.
4. **Groom / Stable Hand (`groom`):** Trực tiếp chăm sóc chuồng trại, thực hiện buổi tập được giao, báo cáo kết quả tập và gửi báo cáo sự cố.
5. **Horse Owner (`horse_owner`):** Theo dõi thể trạng chiến mã sở hữu, phê duyệt giáo án, phê duyệt đơn đăng ký thi đấu và chi trả phí dịch vụ.

## 1.4. Cơ chế đồng bộ dữ liệu thời gian thực (SignalR Realtime)
* **Hub Endpoint:** `http://localhost:5214/horseHub`
* **Sự kiện phát sóng (Broadcast Events):**
  - `ReceiveHorseUpdate`: Bắn thông báo khi có thay đổi lý lịch, cân nặng hoặc trạng thái ngựa.
  - `ReceiveTrainingLockUpdate`: Cập nhật tức thì trạng thái khóa tập / gỡ khóa giữa Bác sĩ và HLV.
  - `ReceiveIncidentUpdate`: Đẩy báo cáo sự cố từ Groom lên màn hình Bác sĩ và Quản lý ngay khi bấm gửi.
* **Phía Frontend:** Hook `useHorseRealtime` lắng nghe sự kiện để tự động kích hoạt tải lại dữ liệu mà không cần tải lại toàn bộ trang web.

---

# CHƯƠNG 2: THÔNG TIN TÀI KHOẢN VÀ HƯỚNG DẪN CÀI ĐẶT

## 2.1. Danh sách tài khoản thử nghiệm chuẩn
Mật khẩu mặc định của tất cả các tài khoản nội bộ là: `123456`

| STT | Vai trò | Tên hiển thị | Email đăng nhập | Quyền hạn chính |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Quản lý CLB** | Hoàng Ngọc Mai | `manager@horseclub.test` | Toàn quyền quản trị CLB, duyệt tài khoản, nhân sự, vật tư |
| 2 | **HLV Trưởng** | Nguyễn Minh Quân | `trainer@horseclub.test` | Quản lý giáo án, giao lịch tập, đánh giá buổi tập, đề xuất giải đua |
| 3 | **Bác sĩ thú y** | Trần Thu Hà | `vet@horseclub.test` | Khám bệnh, kê đơn, đặt lệnh khóa tập, tiêm phòng, xử lý sự cố y tế |
| 4 | **Nhân viên chăm sóc** | Lê Hoàng Nam | `groom@horseclub.test` | Nhiệm vụ chuồng trại, báo cáo sự cố, thực hiện buổi tập được giao |
| 5 | **Chủ ngựa** | Trần Văn Đức | `owner@horseclub.test` | Xem ngựa sở hữu, duyệt giáo án, duyệt thi đấu, thanh toán viện phí |

## 2.2. Yêu cầu môi trường vận hành
- Hệ điều hành: Windows 10/11, macOS, hoặc Linux.
- .NET SDK: Phiên bản 8.0.x (kiểm tra bằng lệnh: `dotnet --version`).
- Node.js: Phiên bản 18.x hoặc 20.x trở lên (kiểm tra bằng lệnh: `node -v`).
- Microsoft SQL Server: Phiên bản 2017 trở lên có cài đặt SQL Server Management Studio (SSMS).

## 2.3. Hướng dẫn khởi chạy Backend API (.NET 8)
1. Mở cửa sổ Terminal (PowerShell hoặc Command Prompt).
2. Điều hướng vào thư mục khởi chạy API:
   ```powershell
   cd "d:\ky 5\SWP\horse\BE_Horse_Training\SWP.API"
   ```
3. Kiểm tra kết nối cơ sở dữ liệu trong file `appsettings.json` (đảm bảo Server Name trỏ đúng instance SQL Server cục bộ):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=Horse_managerment;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```
4. Thực thi lệnh khởi chạy:
   ```powershell
   dotnet run --launch-profile http
   ```
5. Dịch vụ Backend lắng nghe tại cổng: `http://localhost:5214`.
   Trang tài liệu Swagger UI truy cập tại: `http://localhost:5214/swagger`.

## 2.4. Hướng dẫn khởi chạy Frontend Web App (React + Vite)
1. Mở một cửa sổ Terminal độc lập thứ hai.
2. Điều hướng vào thư mục mã nguồn giao diện:
   ```powershell
   cd "d:\ky 5\SWP\horse\FE_Horse_Training\racehorse-training-management-FE"
   ```
3. Cài đặt các gói phụ thuộc (Dependencies):
   ```powershell
   npm install
   ```
4. Chạy máy chủ phát triển (Development Server):
   ```powershell
   npm run dev
   ```
5. Mở trình duyệt web (Google Chrome hoặc Microsoft Edge) và truy cập đường dẫn:
   `http://localhost:5174/login`

---

# CHƯƠNG 3: ĐẶC TẢ CƠ SỞ DỮ LIỆU (DATABASE DICTIONARY)

Hệ thống cơ sở dữ liệu `Horse_managerment` được thiết kế chuẩn hóa bậc 3 (3NF) với các nhóm bảng cụ thể:

## 3.1. Nhóm bảng Người dùng & Phân quyền
* **`User` (Bảng thông tin tài khoản):**
  - `UserID` (INT, PK, Identity): Định danh tài khoản duy nhất.
  - `HoTen` (NVARCHAR(100)): Họ và tên đầy đủ của người dùng.
  - `Email` (VARCHAR(100), Unique): Email dùng đăng nhập hệ thống.
  - `PasswordHash` (VARCHAR(255)): Mật khẩu đã được mã hóa an toàn (PBKDF2/BCrypt).
  - `Role` (VARCHAR(30)): Mã vai trò (`club_manager`, `head_trainer`, `veterinarian`, `groom`, `horse_owner`).
  - `PhoneNumber` (VARCHAR(20)): Số điện thoại liên lạc.
  - `IdentityCardNumber` (VARCHAR(20)): Số CCCD/Hộ chiếu (đối với Chủ ngựa).
  - `TrangThai` (NVARCHAR(30)): Trạng thái tài khoản (`Active`, `Pending`, `Rejected`, `Locked`).
  - `MustChangePassword` (BIT): Cờ bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
  - `CreatedAt` (DATETIME): Thời điểm tạo tài khoản.

## 3.2. Nhóm bảng Hồ sơ Ngựa & Thể trạng
* **`Horse` (Bảng hồ sơ chiến mã):**
  - `HorseID` (INT, PK, Identity): Mã định danh duy nhất của chiến mã.
  - `Ten` (NVARCHAR(100)): Tên đăng ký chính thức của ngựa.
  - `Giong` (NVARCHAR(50)): Giống loài (Thoroughbred, Arabian, Quarter Horse, v.v.).
  - `NgaySinh` (DATE): Ngày tháng năm sinh.
  - `Gender` (NVARCHAR(20)): Giới tính chiến mã (Ngựa đực, Ngựa cái, Ngựa thiến).
  - `CanNang` (DECIMAL(6,2)): Cân nặng hiện tại tính theo kilogram (kg).
  - `ChieuCao` (DECIMAL(5,2)): Chiều cao tính đến vai ngựa (hands hoặc cm).
  - `HinhAnh` (VARCHAR(500)): Đường dẫn ảnh Cloudinary hoặc ảnh nội bộ.
  - `OwnerID` (INT, FK $\rightarrow$ `User.UserID`): Khóa ngoại liên kết tới Chủ sở hữu.
  - `TrangThai` (NVARCHAR(50)): Trạng thái hiện tại (`Đủ điều kiện`, `Đang điều trị`, `Cách ly`).
  - `CreatedAt` (DATETIME): Thời điểm tiếp nhận vào câu lạc bộ.

## 3.3. Nhóm bảng Y tế & Lệnh khóa huấn luyện
* **`MedicalRecord` (Bảng bệnh án y tế):**
  - `RecordID` (INT, PK, Identity): Mã hồ sơ khám bệnh.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Chiến mã được khám.
  - `VetID` (INT, FK $\rightarrow$ `User.UserID`): Bác sĩ thú y phụ trách ca khám.
  - `Ngay` (DATE): Ngày thực hiện thăm khám.
  - `ChanDoan` (NVARCHAR(500)): Chẩn đoán bệnh lý hoặc kết luận thể lực.
  - `PhacDo` (NVARCHAR(1000)): Phác đồ điều trị, đơn thuốc và chế độ tĩnh dưỡng.
  - `KetQuaKham` (NVARCHAR(100)): Kết luận khám tổng quát (`Bình thường`, `Bất thường`).
  - `ViTriChanThuong` (NVARCHAR(200)): Vị trí tổn thương cụ thể trên cơ thể ngựa.
* **`TrainingLock` (Bảng lệnh khóa huấn luyện):**
  - `LockID` (INT, PK, Identity): Mã lệnh khóa.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Ngựa bị áp dụng lệnh cấm tập.
  - `VetID` (INT, FK $\rightarrow$ `User.UserID`): Bác sĩ ban hành lệnh khóa.
  - `NgayDat` (DATE): Ngày bắt đầu có hiệu lực cấm tập luyện.
  - `NgayMo` (DATE, Nullable): Ngày dỡ bỏ lệnh khóa sau khi bình phục.
  - `LyDo` (NVARCHAR(500)): Lý do y khoa bắt buộc ngừng vận động.
  - `TrangThai` (NVARCHAR(30)): Trạng thái lệnh (`Active` - Đang khóa, `Released` - Đã gỡ).
* **`VaccinationSchedule` (Bảng lịch tiêm phòng):**
  - `ScheduleID` (INT, PK, Identity): Mã lịch tiêm phòng.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Ngựa được chỉ định tiêm.
  - `TenVaccine` (NVARCHAR(100)): Tên loại vaccine (Cúm, Uốn ván, Dại...).
  - `NgayDuKien` (DATE): Ngày hẹn tiêm theo phác đồ.
  - `NgayTiemThucTe` (DATE, Nullable): Ngày bác sĩ thực hiện tiêm thực tế.
  - `TrangThai` (NVARCHAR(30)): Trạng thái (`Scheduled`, `Completed`, `Overdue`).

## 3.4. Nhóm bảng Kế hoạch Huấn luyện & Buổi tập
* **`TrainingPlan` (Bảng giáo án huấn luyện):**
  - `PlanID` (INT, PK, Identity): Mã giáo án.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Chiến mã áp dụng giáo án.
  - `TrainerID` (INT, FK $\rightarrow$ `User.UserID`): HLV Trưởng biên soạn giáo án.
  - `GroomID` (INT, FK, Nullable $\rightarrow$ `User.UserID`): Nài ngựa được phân công kèm cặp.
  - `MucTieu` (NVARCHAR(255)): Mục tiêu (Rèn sức bền, Tăng tốc nước rút...).
  - `NgayBatDau` (DATE): Ngày bắt đầu lộ trình.
  - `NgayKetThuc` (DATE): Ngày tổng kết lộ trình.
  - `CuongDo` (NVARCHAR(50)): Cường độ (`Nhẹ`, `Trung bình`, `Cao`).
  - `TrangThai` (NVARCHAR(50)): Trạng thái duyệt (`Draft`, `PendingOwner`, `Approved`, `Rejected`, `Active`, `Completed`).
* **`TrainingSession` (Bảng buổi tập chi tiết):**
  - `SessionID` (INT, PK, Identity): Mã buổi tập cụ thể.
  - `PlanID` (INT, FK $\rightarrow$ `TrainingPlan.PlanID`): Thuộc giáo án nào.
  - `NgayTap` (DATE): Ngày diễn ra buổi tập.
  - `BaiTap` (NVARCHAR(255)): Tên bài tập (Chạy việt dã, Luyện bứt tốc 400m...).
  - `QuangDuong` (DECIMAL(6,2)): Quãng đường yêu cầu / thực tế (km).
  - `ThoiGian` (DECIMAL(5,2)): Thời lượng buổi tập (phút).
  - `NhipTimSauTap` (INT): Chỉ số nhịp tim của ngựa sau khi hoàn thành (bpm).
  - `GroomReport` (NVARCHAR(1000)): Báo cáo phản hồi từ Nài ngựa.
  - `TrainerReview` (NVARCHAR(1000)): Đánh giá và chỉ đạo chuyên môn của HLV.
  - `TrangThai` (NVARCHAR(30)): Trạng thái (`Scheduled`, `Reported`, `Reviewed`).

## 3.5. Nhóm bảng Chuồng trại, Sự cố & Dinh dưỡng
* **`Stable` (Bảng quản lý ô chuồng):**
  - `StableID` (INT, PK, Identity): Mã ô chuồng.
  - `SoChuong` (VARCHAR(20)): Số ký hiệu chuồng (A1, A2, B1...).
  - `HorseID` (INT, FK, Nullable $\rightarrow$ `Horse.HorseID`): Ngựa đang cư ngụ.
  - `TrangThai` (NVARCHAR(30)): Trạng thái (`Trống`, `Đang sử dụng`, `Bảo trì`).
* **`IncidentReport` (Bảng báo cáo sự cố):**
  - `ReportID` (INT, PK, Identity): Mã báo cáo sự cố.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Ngựa liên quan đến sự cố.
  - `GroomID` (INT, FK $\rightarrow$ `User.UserID`): Nhân viên phát hiện và gửi báo cáo.
  - `Ngay` (DATETIME): Thời điểm xảy ra sự việc.
  - `LoaiSuCo` (NVARCHAR(50)): Phân loại (`Vết thương`, `Khập khiễng`, `Bỏ ăn`, `Chuồng/thiết bị hỏng`, `Khác`).
  - `MoTa` (NVARCHAR(500)): Mô tả chi tiết hiện trường.
  - `HinhAnh` (VARCHAR(500)): Ảnh hiện trường sự cố đính kèm.
  - `HandledBy` (INT, FK, Nullable $\rightarrow$ `User.UserID`): Bác sĩ hoặc Quản lý tiếp nhận.
  - `HandledAt` (DATETIME, Nullable): Thời điểm xử lý xong.
  - `GhiChuXuLy` (NVARCHAR(500)): Biện pháp đã thực hiện để khắc phục.
  - `TrangThai` (NVARCHAR(30)): Trạng thái (`Mới`, `Đang xử lý`, `Đã xử lý`).
* **`CareTask` (Bảng nhiệm vụ chăm sóc hàng ngày):**
  - `TaskID` (INT, PK, Identity): Mã nhiệm vụ.
  - `GroomID` (INT, FK $\rightarrow$ `User.UserID`): Nhân viên được giao.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Ngựa được chăm sóc.
  - `TenNhiemVu` (NVARCHAR(100)): Tên việc (Tắm chải, Cho ăn sáng, Dọn chuồng...).
  - `NgayThucHien` (DATE): Ngày phân bổ công việc.
  - `TrangThai` (NVARCHAR(30)): Trạng thái (`Chờ làm`, `Hoàn thành`).

## 3.6. Nhóm bảng Giải đua & Phê duyệt thi đấu
* **`Race` (Bảng thông tin giải đua):**
  - `RaceID` (INT, PK, Identity): Mã giải đua.
  - `TenGiaiDua` (NVARCHAR(200)): Tên giải đua chính thức.
  - `DiaDiem` (NVARCHAR(200)): Địa điểm tổ chức trường đua.
  - `NgayThiDau` (DATETIME): Thời gian khai mạc giải.
  - `CuLy` (INT): Cự ly đường đua tính bằng mét (1200m, 1600m, 2400m).
  - `CoCauGiaiThuong` (DECIMAL(18,2)): Tổng giá trị giải thưởng tiền mặt.
* **`RaceRegistration` (Bảng đăng ký thi đấu & Duyệt 3 cấp):**
  - `RegistrationID` (INT, PK, Identity): Mã đăng ký.
  - `RaceID` (INT, FK $\rightarrow$ `Race.RaceID`): Giải đấu tham dự.
  - `HorseID` (INT, FK $\rightarrow$ `Horse.HorseID`): Chiến mã tranh tài.
  - `TrainerApproved` (BIT): Cấp 1 - HLV Trưởng đề xuất đăng ký.
  - `OwnerApproved` (BIT, Nullable): Cấp 2 - Chủ ngựa phê duyệt đồng ý.
  - `ManagerApproved` (BIT, Nullable): Cấp 3 - Quản lý CLB chốt danh sách chính thức.
  - `ThuHang` (INT, Nullable): Thứ hạng đạt được sau giải đấu (1, 2, 3...).
  - `ThoiGianChay` (DECIMAL(6,2), Nullable): Thời gian về đích (giây).
  - `TienThuongDatDuoc` (DECIMAL(18,2), Nullable): Tiền thưởng thực nhận.

## 3.7. Nhóm bảng Vật tư & Nhật ký hệ thống (Audit Log)
* **`Supply` (Bảng vật tư, thức ăn & dược phẩm):**
  - `SupplyID` (INT, PK, Identity): Mã mặt hàng vật tư.
  - `TenVatTu` (NVARCHAR(100)): Tên hàng (Cỏ khô Alfalfa, Yến mạch, Băng quấn cổ chân...).
  - `LoaiVatTu` (NVARCHAR(50)): Loại (`Thức ăn`, `Dược phẩm`, `Thiết bị`).
  - `SoLuongTon` (DECIMAL(10,2)): Số lượng thực tế có trong kho.
  - `DonViTinh` (NVARCHAR(20)): Đơn vị (kg, bao, lọ, cuộn).
  - `MucToiThieu` (DECIMAL(10,2)): Ngưỡng tối thiểu kích hoạt cảnh báo hết hàng.
* **`AuditLog` (Bảng nhật ký kiểm toán hệ thống):**
  - `LogID` (INT, PK, Identity): Mã nhật ký.
  - `UserID` (INT, FK $\rightarrow$ `User.UserID`): Người thực hiện hành vi.
  - `HanhDong` (NVARCHAR(255)): Nội dung thao tác (Thêm ngựa, Duyệt giải đua, Đặt lệnh cấm...).
  - `TargetTable` (VARCHAR(50)): Bảng dữ liệu bị tác động.
  - `TargetID` (INT): Khóa chính của bản ghi bị tác động.
  - `ThoiGian` (DATETIME): Thời điểm chính xác phát sinh hành vi.

---

# CHƯƠNG 4: DANH MỤC ENDPOINTS BACKEND API

Mọi yêu cầu gửi đến API đều bắt buộc gửi kèm Header: `Authorization: Bearer <JWT_TOKEN>` (trừ các endpoint đăng nhập / đăng ký công khai).

## 4.1. Xác thực & Tài khoản (Auth & Accounts)
* `POST /api/auth/login`: Xác thực tài khoản bằng Email/Password $\rightarrow$ Trả về JWT Token, thông tin User và danh sách quyền.
* `POST /api/auth/register`: Đăng ký tài khoản mới cho Chủ ngựa (trạng thái ban đầu: `Pending`).
* `POST /api/auth/change-password`: Đổi mật khẩu cho người dùng hiện tại (bắt buộc với tài khoản cấp mới).

## 4.2. Hồ sơ Ngựa (Horses Management)
* `GET /api/horses`: Lấy danh sách toàn bộ chiến mã trong câu lạc bộ.
* `GET /api/horses/{id}`: Xem chi tiết lý lịch chiến mã theo mã định danh.
* `GET /api/horses/health-statuses`: Tra cứu trạng thái sức khỏe tổng hợp mới nhất của toàn đàn.
* `POST /api/manager/horses`: Tạo mới hồ sơ ngựa (Dành riêng cho Quản lý CLB).
* `PUT /api/manager/horses/{id}`: Cập nhật thông tin lý lịch, cân nặng, chiều cao của ngựa.
* `DELETE /api/manager/horses/{id}`: Xóa ngựa khỏi hệ thống (Tự động chặn nếu ngựa đã có dữ liệu ràng buộc).

## 4.3. Quản lý CLB (Club Manager Endpoints)
* `GET /api/manager/account-approvals`: Lấy danh sách hồ sơ Chủ ngựa đang chờ phê duyệt.
* `POST /api/manager/account-approvals/{id}/approve`: Phê duyệt kích hoạt tài khoản Chủ ngựa.
* `POST /api/manager/account-approvals/{id}/reject`: Từ chối kích hoạt tài khoản kèm lý do.
* `GET /api/manager/staff`: Danh sách tài khoản nhân viên (HLV, Bác sĩ, Nài ngựa).
* `POST /api/manager/staff`: Cấp mới tài khoản nhân viên nội bộ.
* `PUT /api/manager/staff/{id}`: Khóa / Mở khóa tài khoản nhân viên.
* `GET /api/manager/incidents`: Xem toàn bộ các sự cố trong khuôn viên trang trại.
* `POST /api/manager/incidents/{id}/status`: Cập nhật tiến độ xử lý sự cố chuồng trại.
* `GET /api/audit-logs`: Truy xuất nhật ký kiểm toán hệ thống theo bộ lọc thời gian.

## 4.4. Huấn luyện viên trưởng (Trainer Endpoints)
* `GET /api/trainer/training-plans`: Danh sách toàn bộ giáo án do HLV quản lý.
* `POST /api/trainer/training-plans`: Tạo mới giáo án huấn luyện bản nháp.
* `POST /api/trainer/training-plans/{id}/submit`: Đệ trình giáo án lên Chủ ngựa phê duyệt.
* `POST /api/trainer/training-plans/{id}/activate`: Kích hoạt giáo án đã được duyệt và gán nài ngựa phụ trách.
* `POST /api/trainer/training-plans/{id}/weekly-schedule`: Khởi tạo lịch tập các ngày trong tuần.
* `GET /api/trainer/training-sessions`: Danh sách các buổi tập cần giám sát / đánh giá.
* `POST /api/trainer/training-sessions/{id}/review`: HLV gửi nhận xét đánh giá buổi tập.
* `POST /api/trainer/training-sessions/{id}/send-to-owner`: Gửi báo cáo kết quả buổi tập đến Chủ ngựa.

## 4.5. Bác sĩ thú y (Veterinarian Endpoints)
* `GET /api/vet/medical-records`: Tra cứu toàn bộ sổ bệnh án của đàn ngựa.
* `POST /api/vet/medical-records`: Lập hồ sơ khám bệnh mới kèm chẩn đoán và phác đồ.
* `GET /api/vet/training-locks`: Xem danh sách Lệnh khóa huấn luyện (Mở quyền cho cả Quản lý CLB).
* `POST /api/vet/training-locks`: Ban hành lệnh khóa huấn luyện mới.
* `POST /api/vet/training-locks/{id}/release`: Dỡ bỏ lệnh khóa huấn luyện cho ngựa đã hồi phục.
* `GET /api/vet/vaccinations`: Lấy lịch tiêm phòng kèm phân loại quá hạn / sắp tới 14 ngày.
* `POST /api/vet/vaccinations`: Đặt lịch tiêm phòng mới.
* `PUT /api/vet/vaccinations/{id}/complete`: Ghi nhận hoàn thành mũi tiêm thực tế.
* `GET /api/vet/incidents`: Tiếp nhận các sự cố y tế (vết thương, khập khiễng, bỏ ăn).
* `POST /api/vet/incidents/{id}/status`: Nhận xử lý hoặc kết thúc ca sự cố y tế.

## 4.6. Chăm sóc & Chuồng trại (Groom Endpoints)
* `GET /api/groom/tasks`: Lấy danh sách nhiệm vụ chăm sóc được phân công hôm nay.
* `PUT /api/groom/tasks/{id}/complete`: Đánh dấu đã làm xong nhiệm vụ chăm sóc.
* `GET /api/groom/stables`: Tra cứu sơ đồ ô chuồng và vị trí chiến mã cư ngụ.
* `GET /api/groom/incidents`: Danh sách lịch sử báo cáo sự cố do chính nài ngựa gửi.
* `POST /api/groom/incidents`: Gửi báo cáo sự cố mới kèm hình ảnh hiện trường.
* `GET /api/training-assignments/me`: Danh sách các buổi tập mà HLV giao cho Nài ngựa thực hiện.
* `POST /api/groom/training-sessions/{id}/report`: Nài ngựa nộp kết quả thông số buổi tập.

## 4.7. Giải đua & Quy trình Phê duyệt (Races & Approvals)
* `GET /api/races`: Danh sách các giải đua ngựa sắp diễn ra.
* `POST /api/races`: Ban tổ chức / Quản lý tạo giải đua mới.
* `GET /api/approvals/races`: Xem danh sách đơn đăng ký thi đấu theo phân quyền của người gọi API.
* `POST /api/approvals/races`: HLV gửi đề xuất đăng ký ngựa thi đấu (Duyệt Cấp 1).
* `POST /api/approvals/races/{id}/owner-approve`: Chủ ngựa bấm đồng ý thi đấu (Duyệt Cấp 2).
* `POST /api/approvals/races/{id}/manager-approve`: Quản lý CLB đóng dấu tham dự chính thức (Duyệt Cấp 3).
* `PUT /api/races/{raceId}/registrations/{regId}/result`: Ghi nhận thứ hạng và tiền thưởng thực tế.

---

# CHƯƠNG 5: HƯỚNG DẪN THAO TÁC CHI TIẾT TỪNG MÀN HÌNH (5 VAI TRÒ)

## 5.1. Phân hệ Quản lý CLB (Club Manager)

### Màn hình 1: Dashboard Thống kê đàn ngựa (`/manager/dashboard`)
* **Mục đích:** Cung cấp cái nhìn bao quát về tình trạng vận hành, sức khỏe và các công việc khẩn cấp trong ngày của toàn bộ CLB.
* **Giao diện chính:**
  - 4 Thẻ KPI trên cùng: `Tổng số ngựa` (con), `Đang điều trị / Khóa tập` (con), `Tỷ lệ sẵn sàng` (%), `Cân nặng trung bình` (kg).
  - Thanh tỷ lệ phân bố sức khỏe 4 trạng thái (Đủ điều kiện, Cần theo dõi, Đang điều trị, Cách ly).
  - 4 Thẻ chỉ số phụ trách nhiệm Quản lý: Tài khoản chờ duyệt, Giải đua chờ duyệt, Sự cố chuồng trại mới, Vật tư sắp hết.
  - Bảng danh sách chiến mã điều khiển nhanh: Có nút "Xem hồ sơ" mở popup chi tiết trực tiếp.
* **Thao tác người dùng:**
  - Bấm vào các thẻ chỉ số để xem con số chi tiết.
  - Khi có sự cố mới hoặc tài khoản chờ duyệt, bấm vào thẻ chỉ số để chuyển thẳng đến màn hình giải quyết.

### Màn hình 2: Quản lý hồ sơ ngựa (`/manager/horses`)
* **Mục đích:** Quản lý danh mục toàn bộ ngựa đua trong khuôn viên trang trại.
* **Thao tác Thêm mới ngựa (`/manager/horses/new`):**
  - Bước 1: Nhấn nút **"+ Thêm ngựa"** ở góc phải màn hình.
  - Bước 2: Điền Tên chiến mã, chọn Giống loài từ danh sách (Thoroughbred, Arabian, v.v.).
  - Bước 3: Chọn Ngày sinh, Giới tính (Ngựa đực, Ngựa cái), Cân nặng (kg), Chiều cao.
  - Bước 4: Chọn Chủ sở hữu đại diện từ danh sách tài khoản Chủ ngựa đã kích hoạt.
  - Bước 5: Bấm vùng chọn ảnh để tải ảnh chiến mã lên (hệ thống tự động lưu trữ trên Cloudinary).
  - Bước 6: Nhấn **"Lưu hồ sơ"**. Hệ thống tạo bản ghi và chuyển hướng về danh sách kèm thông báo Toast xanh.
* **Thao tác Chỉnh sửa / Xóa ngựa:**
  - Bấm nút **"Sửa"** trên dòng ngựa tương ứng để cập nhật lại thông số thể trạng.
  - Bấm nút **"Xóa"**: Hộp thoại cảnh báo xuất hiện. Nếu ngựa đã có lịch sử khám bệnh hoặc giáo án, hệ thống sẽ báo lỗi vi phạm ràng buộc toàn vẹn dữ liệu để bảo vệ lịch sử y khoa.

### Màn hình 3: Phê duyệt tài khoản Chủ ngựa (`/manager/approvals`)
* **Mục đích:** Xét duyệt các đơn đăng ký thành viên Chủ sở hữu ngựa gửi từ trang công khai.
* **Thao tác duyệt:**
  - Bước 1: Kiểm tra danh sách bảng `Tài khoản chờ duyệt`.
  - Bước 2: Nhấn vào dòng tài khoản để xem thông tin: Họ tên, Số điện thoại, Email, Số CMND/CCCD, Địa chỉ cư trú.
  - Bước 3: 
    * Nhấn **"Phê duyệt"**: Tài khoản kích hoạt ngay lập tức, chủ ngựa nhận được quyền đăng nhập.
    * Nhấn **"Từ chối"**: Nhập lý do từ chối (ví dụ: "Số CCCD không hợp lệ"). Hồ sơ chuyển sang trạng thái bị từ chối.

### Màn hình 4: Phê duyệt đăng ký thi đấu (`/manager/race-registrations`)
* **Mục đích:** Thẩm định lần cuối các đăng ký tham gia giải đua sau khi HLV và Chủ ngựa đã đồng thuận.
* **Thao tác duyệt:**
  - Kiểm tra thông tin: Tên chiến mã, HLV đề xuất, Chủ ngựa xác nhận, Tên giải đua, Cự ly.
  - Nhấn **"Chấp thuận"**: Chiến mã chính thức có tên trong danh sách xuất phát của giải đấu.
  - Nhấn **"Từ chối"**: Hủy đăng ký thi đấu đối với giải đó.

### Màn hình 5: Quản lý nhân sự (`/manager/staff`)
* **Mục đích:** Cấp phát và quản lý quyền truy cập của đội ngũ HLV, Bác sĩ và Nài ngựa.
* **Thao tác Cấp tài khoản mới (`/manager/staff/new`):**
  - Điền Họ tên nhân viên, Email nội bộ, Số điện thoại.
  - Chọn Vai trò công việc: `Head Trainer`, `Veterinarian`, hoặc `Groom`.
  - Đặt mật khẩu khởi tạo (mặc định: `123456`).
  - Đánh dấu cờ `Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên`.
  - Nhấn **"Lưu nhân sự"**.

### Màn hình 6: Quản lý vật tư & Dinh dưỡng (`/manager/supplies`)
* **Mục đích:** Kiểm soát kho thức ăn, cỏ khô và dược phẩm y tế của trang trại.
* **Giao diện & Cảnh báo:**
  - Các mặt hàng có `Số lượng tồn` $\le` `Mức tối thiểu` sẽ tự động hiển thị nhãn đỏ **"Sắp hết hàng"**.
  - Bấm **"Thêm vật tư"** để bổ sung mặt hàng mới hoặc bấm **"Nhập kho"** để tăng số lượng tồn.

### Màn hình 7: Xử lý sự cố chuồng trại & Cơ sở vật chất (`/manager/incidents`)
* **Mục đích:** Tiếp nhận và khắc phục các sự cố hư hại về hạ tầng cơ sở do nhân viên chăm sóc báo cáo.
* **Thao tác xử lý:**
  - Xem danh sách báo cáo có phân loại: `Chuồng/thiết bị hỏng`, `Khác`.
  - Bấm vào hàng để mở hộp thoại chi tiết: Xem ảnh hiện trường hư hỏng, người báo, vị trí chuồng.
  - Nhấn **"Nhận xử lý"** để ghi nhận bạn đang phụ trách.
  - Sau khi sửa chữa cơ sở vật chất xong, bấm **"Hoàn tất xử lý"** để đóng báo cáo.

### Màn hình 8: Nhật ký kiểm toán hệ thống (`/manager/audit-log`)
* **Mục đích:** Giám sát an ninh và lịch sử thao tác của tất cả các tài khoản trên hệ thống.
* **Tính năng:**
  - Bảng ghi nhận chi tiết: Thời gian (chính xác đến giây), Người thực hiện (kèm ID), Hành động cụ thể, Bảng dữ liệu tác động và Đối tượng liên quan.
  - Bộ lọc tìm kiếm theo từ khóa hành động hoặc lọc theo người thực hiện.

---

## 5.2. Phân hệ Huấn luyện viên trưởng (Head Trainer)

### Màn hình 1: Dashboard Huấn luyện (`/trainer/dashboard`)
* **Mục đích:** Giám sát nhanh số lượng ngựa đang tập, ngựa bị cấm tập và các buổi tập cần đánh giá trong ngày.
* **Tính năng:**
  - 4 Thẻ KPI: Tổng số ngựa trong trại, Ngựa đang bị cấm tập do y tế, Ngựa đủ điều kiện tập (%), Giáo án đang hoạt động.
  - Danh sách nhanh các buổi tập hôm nay cần nài ngựa thực hiện hoặc cần HLV phê duyệt nhận xét.

### Màn hình 2: Lập & Quản lý giáo án huấn luyện (`/trainer/plans`)
* **Mục đích:** Thiết lập lộ trình nâng cao thể lực và kỹ năng cho từng chiến mã.
* **Quy trình Lập giáo án mới (`/trainer/plans/new`):**
  - **Bước 1:** Chọn Chiến mã. *Lưu ý: Nếu ngựa đang có Lệnh khóa huấn luyện của bác sĩ thú y, hệ thống sẽ hiển thị cảnh báo đỏ và khóa nút lưu, ngăn chặn việc ép tập ngựa đau.*
  - **Bước 2:** Chọn Mục tiêu: `Tăng tốc độ`, `Rèn sức bền`, `Phản xạ xuất phát`, hoặc `Phục hồi thể lực`.
  - **Bước 3:** Đặt Ngày bắt đầu và Ngày kết thúc lộ trình (thường từ 4 đến 12 tuần).
  - **Bước 4:** Chọn Cường độ huấn luyện (`Nhẹ`, `Trung bình`, `Cao`) kèm ghi chú bài tập trọng tâm.
  - **Bước 5:** Bấm **"Lưu giáo án"** (trạng thái ban đầu: `Bản nháp`).
* **Quy trình Gửi chủ ngựa duyệt & Kích hoạt:**
  - Tại trang chi tiết giáo án (`/trainer/plans/{id}`), HLV bấm nút **"Gửi chủ ngựa duyệt"**.
  - Giáo án chuyển sang trạng thái `Chờ chủ ngựa duyệt`.
  - Sau khi Chủ ngựa bấm Duyệt, trạng thái giáo án chuyển thành `Đã phê duyệt`.
  - HLV mở lại giáo án, bấm **"Kích hoạt giáo án"** $\rightarrow$ Chọn Nài ngựa (Groom) phụ trách $\rightarrow$ Bấm sinh lịch tập tuần tự động.

### Màn hình 3: Quản lý buổi tập & Đánh giá kết quả (`/trainer/sessions`)
* **Mục đích:** Theo dõi thông số vận động thực tế và gửi nhận xét chuyên môn cho chủ ngựa.
* **Thao tác Đánh giá buổi tập:**
  - Bước 1: Khi Nài ngựa đã thực hiện xong bài chạy và gửi báo cáo, buổi tập sẽ có trạng thái `Đã nộp báo cáo`.
  - Bước 2: HLV bấm vào buổi tập để kiểm tra các thông số Nài ngựa đã nộp: Quãng đường chạy thực tế, Thời gian chạy, Tốc độ trung bình, Nhịp tim sau khi dừng chạy.
  - Bước 3: HLV điền đánh giá chuyên môn vào ô `Nhận xét của Huấn luyện viên` (ví dụ: "Ngựa giữ nhịp thở tốt ở 200m cuối, cần tăng thêm bài chạy biến tốc").
  - Bước 4: Nhấn nút **"Đánh giá & Gửi báo cáo cho Chủ ngựa"**. Kết quả được đồng bộ ngay vào trang cá nhân của Chủ ngựa.

### Màn hình 4: Đăng ký giải đua (`/trainer/races`)
* **Mục đích:** Đề xuất chiến mã xuất sắc nhất tham gia các giải đua chính thức.
* **Thao tác:**
  - Xem danh mục các giải đua sắp diễn ra (Tên giải, địa điểm, cự ly, ngày khai mạc).
  - Nhấn **"Đăng ký ngựa thi đấu"** trên giải đua mong muốn.
  - Chọn ngựa đủ điều kiện thể lực $\rightarrow$ Nhấn **"Xác nhận đề xuất"**.
  - Đề xuất được tự động gửi đến tài khoản của Chủ ngựa để xem xét chi phí và đồng ý.

---

## 5.3. Phân hệ Bác sĩ thú y (Veterinarian)

### Màn hình 1: Dashboard Y tế & An toàn sinh học (`/vet/dashboard`)
* **Mục đích:** Theo dõi tổng thể tình trạng thương tật, dịch bệnh và tỷ lệ an toàn của đàn ngựa.
* **Chỉ số theo dõi:**
  - Tổng số chiến mã, Số ca đang điều trị / chấn thương, Số ca cần theo dõi thêm, Số ca hoàn toàn khỏe mạnh.
  - 4 Thẻ nhiệm vụ khẩn cấp: Lệnh khóa huấn luyện đang mở, Sự cố y tế mới từ chuồng, Mũi tiêm phòng cần chú ý (quá hạn hoặc tới hạn trong 14 ngày), Tổng hồ sơ bệnh án an toàn trại.

### Màn hình 2: Sổ bệnh án điện tử (`/vet/exams`)
* **Mục đích:** Ghi nhận lịch sử khám bệnh, chẩn đoán và theo dõi phác đồ phục hồi của ngựa.
* **Thao tác Ghi nhận lần khám bệnh (`/vet/exams/new`):**
  - Bước 1: Chọn Chiến mã cần khám và Ngày khám.
  - Bước 2: Nhập Chẩn đoán ban đầu (ví dụ: `Giãn dây chằng cổ chân sau bên phải`).
  - Bước 3: Chọn Kết quả khám tổng quát: `Bình thường` hoặc `Có bất thường`.
  - Bước 4: Nếu có thương tổn, điền Vị trí chấn thương cụ thể và Phác đồ điều trị (loại thuốc tiêm/uống, chế độ chườm lạnh, số ngày bất động).
  - Bước 5: Bấm **"Lưu bệnh án"**.
  - *Tính năng tự động:* Nếu kết quả khám là bất thường nặng, hệ thống sẽ hiển thị gợi ý tạo ngay **Lệnh khóa huấn luyện** để bảo vệ ngựa.

### Màn hình 3: Quản lý Lệnh khóa huấn luyện (`/vet/locks`)
* **Mục đích:** Ban hành và quản lý quyền cấm tập luyện nhằm đảm bảo y đức và an toàn cho ngựa đua.
* **Thao tác Đặt lệnh cấm tập mới (`/vet/locks/new`):**
  - Chọn Chiến mã cần cách ly/nghỉ ngơi.
  - Chọn Ngày bắt đầu có hiệu lực và ghi rõ Lý do cấm tập (ví dụ: `Vết rách khớp gối cần nghỉ dưỡng tối thiểu 14 ngày`).
  - Nhấn **"Ban hành lệnh khóa"**. Ngay lập tức, SignalR phát tín hiệu khóa chiến mã này trên toàn hệ thống.
* **Thao tác Gỡ lệnh khóa huấn luyện (`Release Lock`):**
  - Khi ngựa đã bình phục hoàn toàn sau đợt tái khám, Bác sĩ mở lệnh khóa đang hoạt động.
  - Nhấn nút **"Gỡ lệnh khóa"** $\rightarrow$ Xác nhận. Chiến mã được chuyển trạng thái sang `Đủ điều kiện` để HLV có thể xếp lịch tập lại.

### Màn hình 4: Quản lý Lịch tiêm phòng (`/vet/vaccinations`)
* **Mục đích:** Quản lý an toàn dịch tễ và tiêm chủng định kỳ cho đàn ngựa.
* **Tính năng:**
  - Hệ thống tự động phân loại mũi tiêm theo 3 màu: **Đỏ (Quá hạn tiêm)**, **Cam (Sắp đến hạn trong 14 ngày)**, **Xám (Còn hạn xa)**.
  - Đặt lịch hẹn mũi tiêm tiếp theo qua form `Đặt lịch tiêm phòng`.
  - Khi đã tiêm xong cho ngựa, Bác sĩ bấm nút **"Ghi nhận đã tiêm"** trên dòng tương ứng để cập nhật ngày tiêm thực tế vào hồ sơ y tế.

### Màn hình 5: Tiếp nhận & Xử lý sự cố y tế (`/vet/incidents`)
* **Mục đích:** Xử lý nhanh các tai nạn phát sinh tại chuồng như ngựa va vào hàng rào, khập khiễng, sốt bỏ ăn do nài ngựa gửi lên.
* **Thao tác:**
  - Bấm vào sự cố để mở hộp thoại chi tiết: Xem ảnh vết thương phóng to, người báo, vị trí chuồng.
  - Bấm **"Nhận xử lý"** (ngăn chặn bác sĩ khác nhận trùng ca).
  - Bấm liên kết nhanh **"Ghi lần khám"** hoặc **"Đặt lệnh khóa huấn luyện"** được tích hợp sẵn trong popup.
  - Sau khi sơ cứu và băng bó xong, bấm **"Hoàn tất xử lý"**.

---

## 5.4. Phân hệ Nhân viên chăm sóc / Nài ngựa (Groom)

### Màn hình 1: Lịch công việc hôm nay (`/groom/tasks`)
* **Mục đích:** Giúp nhân viên chuồng trại không bỏ sót các công việc chăm sóc thường nhật.
* **Thao tác:**
  - Xem danh sách việc trong ngày: Dọn phân và thay rơm chuồng, Tắm rửa chải lông, Cho ăn khẩu phần sáng/trưa/chiều, Dắt ngựa đi bộ thả lỏng.
  - Sau khi hoàn tất công việc nào, tích chọn vào ô vuông tương ứng để chuyển trạng thái sang `Hoàn thành`.

### Màn hình 2: Sơ đồ chuồng trại & Khẩu phần ăn (`/groom/stable`)
* **Mục đích:** Tra cứu vị trí chính xác của từng con ngựa và định lượng thức ăn mỗi bữa.
* **Tính năng:**
  - Xem sơ đồ mặt bằng các dãy chuồng (Dãy A, Dãy B...).
  - Bấm vào từng ô chuồng để tra cứu khẩu phần ăn: Bao nhiêu kg cỏ khô Alfalfa, định lượng yến mạch, các chất điện giải và khoáng chất bổ sung theo yêu cầu của HLV.

### Màn hình 3: Báo cáo sự cố khẩn cấp (`/groom/incidents`)
* **Mục đích:** Kênh thông tin tức thời báo cáo mọi bất thường từ chuồng trại đến bác sĩ và quản lý.
* **Thao tác Gửi báo cáo mới (`/groom/incidents/new`):**
  - **Bố cục 2 cột chuyên nghiệp:** Cột trái là form nhập liệu, cột phải là thẻ Tóm tắt trực tiếp (Live Summary) hiển thị ngay ảnh ngựa, vị trí chuồng và bộ phận sẽ tiếp nhận.
  - **Bước 1:** Chọn Ngựa xảy ra sự cố (hệ thống tự động ưu tiên đưa những con ngựa bạn đang chăm sóc lên đầu danh sách).
  - **Bước 2:** Bấm chọn 1 trong 5 ô Loại sự cố có hình minh họa trực quan:
    * `Vết thương` (chảy máu, trầy xước).
    * `Khập khiễng` (bước đi bất thường, đau chân).
    * `Bỏ ăn` (không ăn hết khẩu phần, ủ rũ).
    * `Chuồng/thiết bị hỏng` (gãy song sắt, hỏng vòi nước, rách đệm lót).
    * `Khác`.
  - **Bước 3:** Nhập mô tả chi tiết: Biểu hiện của ngựa, vị trí vết thương.
  - **Bước 4:** Bấm vùng chọn ảnh để tải ảnh chụp hiện trường từ điện thoại/máy tính.
  - **Bước 5:** Bấm **"Gửi báo cáo"**.
* **Theo dõi tiến trình:**
  - Tại trang danh sách `/groom/incidents`, bảng hiển thị đầy đủ cột **Trạng thái** (`Mới` - Đỏ, `Đang xử lý` - Cam, `Đã xử lý` - Xanh).
  - Bấm vào hàng sự cố để mở ngăn kéo trượt (Drawer) bên phải: Xem dòng thời gian (Timeline 3 bước) để biết Bác sĩ nào đã tiếp nhận và sự cố đã giải quyết xong hay chưa.

### Màn hình 4: Thực hiện buổi tập & Nộp kết quả (`/groom/training`)
* **Mục đích:** Nhận lệnh cưỡi tập từ HLV trưởng và nộp lại thông số vận động của chiến mã.
* **Thao tác:**
  - Xem danh sách bài tập được HLV giao cho mình hôm nay (Cự ly chạy, tốc độ yêu cầu).
  - Sau khi cho ngựa chạy xong trên đường đua, bấm **"Báo cáo kết quả"**.
  - Nhập số liệu thực tế đo được: Quãng đường thực chạy (km), Thời gian hoàn thành (phút/giây), Nhịp tim đo được sau buổi tập (bpm), và ghi chú biểu hiện thể lực của ngựa.
  - Nhấn **"Gửi báo cáo buổi tập"** để chuyển dữ liệu sang cho HLV đánh giá.

---

## 5.5. Phân hệ Chủ ngựa (Horse Owner)

### Màn hình 1: Danh sách chiến mã sở hữu (`/owner/horses`)
* **Mục đích:** Khách hàng theo dõi tài sản chiến mã thuộc quyền sở hữu của mình tại câu lạc bộ.
* **Tính năng:**
  - Hiển thị danh sách thẻ chiến mã: Tên ngựa, giống loài, độ tuổi, hình ảnh đại diện, tình trạng sức khỏe hiện tại và số ô chuồng đang ở.
  - Bấm vào thẻ ngựa để xem chi tiết lý lịch phả hệ và thông số nhân trắc học.

### Màn hình 2: Giám sát sức khỏe & Y tế (`/owner/health`)
* **Mục đích:** Minh bạch hóa 100% tình trạng thể lực và tiền sử bệnh tật của ngựa đua cho chủ sở hữu.
* **Tính năng:**
  - Xem toàn bộ nhật ký các lần khám bệnh của Bác sĩ thú y: Ngày khám, bác sĩ phụ trách, chẩn đoán và phác đồ điều trị.
  - Xem lịch sử tiêm chủng vaccine định kỳ và các mũi tiêm sắp tới.
  - Nhận cảnh báo rõ ràng nếu ngựa đang trong diện bị áp dụng Lệnh khóa huấn luyện.

### Màn hình 3: Lịch trình & Phê duyệt giáo án (`/owner/schedule`)
* **Mục đích:** Quyền quyết định của chủ sở hữu đối với lộ trình tập luyện và mục tiêu phát triển của ngựa.
* **Thao tác:**
  - Khi HLV Trưởng soạn giáo án mới, chủ ngựa sẽ nhận được thông báo tại mục `Giáo án chờ duyệt`.
  - Bấm xem chi tiết: Đọc mục tiêu huấn luyện, cường độ bài tập, ngày bắt đầu và kết thúc.
  - Nhấn **"Phê duyệt"**: Cho phép HLV triển khai áp dụng giáo án.
  - Nhấn **"Từ chối"**: Nhập lý do phản hồi (ví dụ: "Cường độ quá nặng so với ngựa vừa khỏi ốm, đề nghị giảm tải") để HLV điều chỉnh lại.
  - Xem báo cáo đánh giá buổi tập hàng tuần do HLV Trưởng gửi về.

### Màn hình 4: Phê duyệt tham gia giải đua (`/owner/races`)
* **Mục đích:** Xem xét và đồng thuận cho chiến mã tham gia các giải đua chuyên nghiệp.
* **Thao tác:**
  - Nhận đề xuất thi đấu từ HLV Trưởng.
  - Xem thông tin giải đấu: Tên giải, địa điểm trường đua, cự ly thi đấu, cơ cấu giải thưởng.
  - Bấm **"Đồng ý thi đấu"** để xác nhận tham gia $\rightarrow$ Hồ sơ được đẩy lên Quản lý CLB để thẩm định bước cuối.

### Màn hình 5: Chi phí & Thanh toán viện phí/phí chuồng (`/owner/finance`)
* **Mục đích:** Quản lý hóa đơn dịch vụ hàng tháng rõ ràng, minh bạch.
* **Tính năng:**
  - Bảng kê chi tiết từng khoản mục chi tiêu: Phí lưu chuồng, tiền thức ăn dinh dưỡng, chi phí khám chữa bệnh và thuốc men, phí công huấn luyện.
  - Thực hiện bấm xác nhận thanh toán trực tuyến thuận tiện cho từng tháng dịch vụ.

---

## 5.6. Phân hệ Xác thực & Trang công khai (Auth & Public)

### Màn hình 1: Trang chủ giới thiệu CLB (`/`)
* Giới thiệu hình ảnh câu lạc bộ, cơ sở vật chất, đội ngũ huấn luyện viên và các giải thưởng đạt được.
* Nút chuyển hướng nhanh đến màn hình **Đăng nhập** hoặc **Đăng ký làm chủ ngựa**.

### Màn hình 2: Đăng nhập hệ thống (`/login`)
* Nhập Email và Mật khẩu.
* Hệ thống tự động nhận diện Role và chuyển hướng thông minh đến trang đích tương ứng:
  - `club_manager` $\rightarrow$ `/manager/horses` (hoặc `/manager/dashboard`).
  - `head_trainer` $\rightarrow$ `/trainer/plans`.
  - `veterinarian` $\rightarrow$ `/vet/overview`.
  - `groom` $\rightarrow$ `/groom/tasks`.
  - `horse_owner` $\rightarrow$ `/owner/horses`.

### Màn hình 3: Đăng ký tài khoản Chủ ngựa (`/register`)
* Form đăng ký dành cho khách hàng mới: Họ tên, Email, Mật khẩu, Số điện thoại, Số CCCD, Địa chỉ.
* Sau khi bấm Đăng ký, hệ thống chuyển sang màn hình **Trạng thái tài khoản (`/account-status`)** thông báo hồ sơ đang được gửi đến Ban quản lý xét duyệt.

### Màn hình 4: Đổi mật khẩu lần đầu (`/change-password`)
* Đối với nhân sự nội bộ được Quản lý cấp tài khoản ban đầu, ngay sau lần đăng nhập đầu tiên, hệ thống tự động khóa các trang khác và yêu cầu người dùng đặt mật khẩu cá nhân mới để bảo mật tuyệt đối.

---

# CHƯƠNG 6: CÁC KỊCH BẢN KIỂM THỬ LIÊN THÔNG (END-TO-END FLOWS)

Để kiểm chứng toàn diện tính liên thông và toàn vẹn của phần mềm, người dùng hoặc giảng viên chấm đồ án có thể thực hiện tuần tự 5 kịch bản nghiệp vụ khép kín sau:

## Kịch bản 1: Đăng ký tài khoản Chủ ngựa & Khởi tạo chiến mã
* **Bước 1 (Khách hàng):** Mở trình duyệt ẩn danh vào `/register`, nhập thông tin đăng ký tài khoản Chủ ngựa mới (ví dụ: `nguyenvana@gmail.com`). Màn hình hiển thị thông báo "Tài khoản đang chờ duyệt".
* **Bước 2 (Quản lý CLB):** Đăng nhập `manager@horseclub.test`. Vào menu **Duyệt tài khoản** $\rightarrow$ Thấy tài khoản của Nguyễn Văn A $\rightarrow$ Bấm nút **"Phê duyệt"**.
* **Bước 3 (Quản lý CLB):** Vào menu **Quản lý hồ sơ ngựa** $\rightarrow$ Bấm **"+ Thêm ngựa"** $\rightarrow$ Nhập tên chiến mã `Bạch Long Mã`, giống `Thoroughbred`, cân nặng `450kg` $\rightarrow$ Tại ô Chủ sở hữu, chọn `Nguyễn Văn A` $\rightarrow$ Tải ảnh và bấm Lưu.
* **Bước 4 (Chủ ngựa):** Đăng nhập bằng tài khoản `nguyenvana@gmail.com` vừa được duyệt $\rightarrow$ Vào **Chiến mã của tôi** $\rightarrow$ Thấy ngay chiến mã `Bạch Long Mã` đã nằm trong danh sách sở hữu của mình.

## Kịch bản 2: Vòng đời Giáo án huấn luyện (Trainer - Owner - Groom)
* **Bước 1 (HLV Trưởng):** Đăng nhập `trainer@horseclub.test` $\rightarrow$ Vào **Giáo án** $\rightarrow$ Bấm **Tạo giáo án mới** $\rightarrow$ Chọn ngựa `Ruby Storm`, mục tiêu `Tăng sức bền 8 tuần`, cường độ `Trung bình` $\rightarrow$ Lưu bản nháp $\rightarrow$ Bấm **"Gửi chủ ngựa duyệt"**.
* **Bước 2 (Chủ ngựa):** Đăng nhập `owner@horseclub.test` $\rightarrow$ Vào **Lịch trình & Giáo án** $\rightarrow$ Thấy giáo án của `Ruby Storm` ở trạng thái chờ duyệt $\rightarrow$ Nhấn nút **"Phê duyệt"**.
* **Bước 3 (HLV Trưởng):** Đăng nhập lại tài khoản HLV $\rightarrow$ Thấy giáo án đã được duyệt $\rightarrow$ Bấm **"Kích hoạt giáo án"** $\rightarrow$ Chọn phân công Nài ngựa `Lê Hoàng Nam` phụ trách $\rightarrow$ Bấm tạo lịch tập tuần tự động.
* **Bước 4 (Nài ngựa Groom):** Đăng nhập `groom@horseclub.test` $\rightarrow$ Vào mục **Lịch tập được giao** $\rightarrow$ Thấy bài chạy hôm nay của `Ruby Storm` $\rightarrow$ Bấm **Báo cáo kết quả** $\rightarrow$ Nhập quãng đường `5.2 km`, thời gian `25 phút`, nhịp tim `118 bpm` $\rightarrow$ Nộp báo cáo.
* **Bước 5 (HLV Trưởng):** Mở danh sách buổi tập $\rightarrow$ Thấy bài tập đã nộp kết quả $\rightarrow$ Nhập nhận xét: `Ngựa hoàn thành tốt chỉ tiêu thể lực` $\rightarrow$ Bấm **"Đánh giá & Gửi báo cáo cho Chủ ngựa"**.
* **Bước 6 (Chủ ngựa):** Vào trang cá nhân của mình xem báo cáo đánh giá buổi tập vừa được cập nhật.

## Kịch bản 3: Xử lý Y tế & Ràng buộc an toàn chéo (Vet - Trainer)
* **Bước 1 (Bác sĩ thú y):** Đăng nhập `vet@horseclub.test` $\rightarrow$ Vào **Khám bệnh** $\rightarrow$ Ghi nhận lần khám mới cho ngựa `Midnight Star`: Chẩn đoán `Chấn thương khớp gối chân trái`, kết quả `Có bất thường`.
* **Bước 2 (Bác sĩ thú y):** Vào **Lệnh khóa huấn luyện** $\rightarrow$ Bấm **Đặt lệnh khóa** cho `Midnight Star` với lý do `Nghỉ ngơi điều trị dứt điểm chấn thương gối`.
* **Bước 3 (HLV Trưởng - Thử nghiệm ràng buộc an toàn):** Đăng nhập `trainer@horseclub.test` $\rightarrow$ Vào tạo giáo án mới hoặc tạo buổi tập $\rightarrow$ Chọn ngựa `Midnight Star` $\rightarrow$ **Hệ thống cảnh báo đỏ và khóa chức năng lưu, không cho phép tạo lịch tập đối với ngựa đang bị khóa y tế**.
* **Bước 4 (Bác sĩ thú y):** Đăng nhập lại tài khoản Bác sĩ $\rightarrow$ Sau khi điều trị hồi phục, vào **Lệnh khóa huấn luyện** $\rightarrow$ Bấm **"Gỡ lệnh khóa"** cho `Midnight Star`.
* **Bước 5 (HLV Trưởng):** Quay lại form lập lịch tập $\rightarrow$ Ngựa `Midnight Star` đã được mở khóa và có thể xếp lịch tập luyện bình thường.

## Kịch bản 4: Xử lý Sự cố chuồng trại khẩn cấp (Groom - Vet - Manager)
* **Bước 1 (Nài ngựa Groom):** Đăng nhập `groom@horseclub.test` $\rightarrow$ Vào **Báo cáo sự cố** $\rightarrow$ Bấm **Gửi báo cáo** $\rightarrow$ Chọn ngựa `Blue Horizon`, chọn loại sự cố `Vết thương`, nhập mô tả `Ngựa va chân vào then cài cửa chuồng gây trầy xước rỉ máu`, tải ảnh chụp hiện trường $\rightarrow$ Bấm Gửi.
* **Bước 2 (Bác sĩ thú y):** Đăng nhập `vet@horseclub.test` $\rightarrow$ Vào **Sự cố cần xử lý** $\rightarrow$ Thấy ngay báo cáo mới từ `Lê Hoàng Nam` $\rightarrow$ Bấm vào xem ảnh hiện trường $\rightarrow$ Nhấn **"Nhận xử lý"**.
* **Bước 3 (Bác sĩ thú y):** Ngay trên popup sự cố, bấm liên kết **"Ghi lần khám"** để kê đơn thuốc sát trùng $\rightarrow$ Bấm **"Hoàn tất xử lý"**.
* **Bước 4 (Nài ngựa Groom):** Đăng nhập lại tài khoản Groom $\rightarrow$ Mở ngăn chi tiết sự cố $\rightarrow$ Timeline 3 bước hiển thị đầy đủ: `Đã gửi báo cáo` $\rightarrow$ `Bác sĩ Trần Thu Hà nhận xử lý` $\rightarrow$ `Hoàn tất xử lý`.

## Kịch bản 5: Quy trình Đăng ký thi đấu 3 cấp độ & Ghi nhận thành tích
* **Bước 1 (HLV Trưởng - Cấp 1):** Đăng nhập `trainer@horseclub.test` $\rightarrow$ Vào **Giải đua** $\rightarrow$ Chọn giải `Cúp Mùa Thu 2026` $\rightarrow$ Bấm Đăng ký thi đấu cho chiến mã `Ruby Storm`.
* **Bước 2 (Chủ ngựa - Cấp 2):** Đăng nhập `owner@horseclub.test` $\rightarrow$ Vào **Giải đua** $\rightarrow$ Thấy thông báo đề xuất tham gia giải của `Ruby Storm` $\rightarrow$ Bấm nút **"Đồng ý thi đấu"**.
* **Bước 3 (Quản lý CLB - Cấp 3):** Đăng nhập `manager@horseclub.test` $\rightarrow$ Vào **Duyệt đăng ký thi đấu** $\rightarrow$ Thấy đơn đã đủ 2 chữ ký xác nhận của HLV và Chủ $\rightarrow$ Bấm **"Chấp thuận"**.
* **Bước 4 (Quản lý CLB - Kết quả):** Sau khi giải kết thúc, Quản lý vào **Kết quả thi đấu** $\rightarrow$ Cập nhật thứ hạng `Về Nhất (Hạng 1)`, thời gian chạy `72.4s`, tiền thưởng `100,000,000 VNĐ`.

---

# CHƯƠNG 7: QUY CHUẨN THIẾT KẾ GIAO DIỆN & HỆ THỐNG THÀNH PHẦN (UI DESIGN SYSTEM)

Dự án tuân thủ nghiêm ngặt phong cách thiết kế **Equestrian Club Design System** nhằm đảm bảo tính thẩm mỹ, nhất quán và trải nghiệm mượt mà trên toàn bộ các trang:

## 7.1. Bảng màu chuẩn phong cách Equestrian Club
* **Màu nhấn thương hiệu (Brand Accent):**
  - Màu cam đất nung (Terracotta Rust): `#c2570c` (màu nút chính, link focus).
  - Màu cam đậm khi hover: `#a8480a`.
* **Nền và Bề mặt (Backgrounds & Surfaces):**
  - Nền trang chính: Nền kem sáng ấm áp `#fbf8f2` hoặc `#faf7f2`.
  - Nền thẻ và bảng: Nền trắng `#ffffff` viền ấm.
  - Nền tiêu đề bảng / Header khối: Màu parchment `#f7f3eb` hoặc `#faf7f2`.
* **Đường viền ngăn cách (Borders):**
  - Viền thẻ và khối thống kê: Màu đá ấm `#cfc4ad` hoặc `#b9ab90`.
  - Viền phân cách ô bảng: `#e4dccb` hoặc `#dfd6c5`.
* **Màu chỉ báo trạng thái (Semantic Badges):**
  - `Mới` / `Khẩn cấp` / `Bị cấm`: Nền đỏ nhạt `bg-[#c0262d]/10`, viền `border-[#c0262d]/25`, chữ đỏ `text-[#b4232a]`.
  - `Đang xử lý` / `Chờ phê duyệt`: Nền cam nhạt `bg-[#c2570c]/10`, viền `border-[#c2570c]/25`, chữ cam `text-[#a8480a]`.
  - `Đã hoàn tất` / `Đủ điều kiện`: Nền xanh lá nhạt `bg-[#4d6b2a]/10`, viền `border-[#4d6b2a]/25`, chữ xanh `text-[#3a541d]`.

## 7.2. Quy tắc Typography và Tiêu đề
* **Font tiêu đề chính (`h1`, `h2`):** Sử dụng font Serif (`font-serif`) cao cấp, cỡ 24px–30px, viết hoa chữ cái đầu của mỗi từ (Title Case), thể hiện tính trang trọng của một câu lạc bộ đua ngựa.
* **Font nội dung:** Sử dụng font Sans-serif trung tính, chiều cao dòng rộng rãi (`leading-relaxed`), chống mỏi mắt khi đọc bệnh án hoặc bảng dữ liệu dài.

## 7.3. Cấu trúc lưới Layout 5 tầng
Mọi trang danh mục đều tuân theo bố cục phân tầng cố định:
1. **Tầng 1 (Page Header):** Tiêu đề Serif lớn, câu giải thích chức năng ngắn gọn và nút hành động chính bên góc phải.
2. **Tầng 2 (Stat Cards / KPIs):** Khung lưới 4 cột chia đều có đường kẻ dọc ngăn cách, hiển thị các chỉ số đếm số lượng bản ghi quan trọng.
3. **Tầng 3 (Toolbars / Filter Bar):** Chiều cao 40px chuẩn (`h-10`), gồm ô tìm kiếm kính lúp và các dropdown phân loại có icon mũi tên.
4. **Tầng 4 (Data Grid / Table):** Bảng dữ liệu có `<colgroup>` cố định bề rộng từng cột, tiêu đề nền kem, các hàng có hiệu ứng hover dịu mắt.
5. **Tầng 5 (Pagination):** Component `<TablePager />` căn lề rõ ràng, hiển thị số trang hiện tại và tổng số dòng dữ liệu.

## 7.4. Danh mục Component dùng chung (Shared Components)
* `<HorseAvatar />`: Hiển thị ảnh đại diện chiến mã dạng vuông hoặc tròn bo góc, tự động gán ảnh ngựa thế mạng chất lượng cao nếu chiến mã chưa có ảnh.
* `<IncidentStatusBadge />`: Huy hiệu trạng thái sự cố có chấm màu (dot) đánh dấu.
* `<CenterDialog />`: Hộp thoại modal giữa màn hình với 3 phần riêng biệt: Header cố định, Body cuộn độc lập và Footer chứa các nút thao tác.
* `<Drawer />`: Ngăn chi tiết trượt từ mép phải màn hình sang, giúp xem nhanh thông tin mà không mất trạng thái cuộn của bảng phía sau.
* `<ConfirmDialog />`: Hộp thoại xác nhận hành động nguy hiểm (Xóa, Từ chối, Ban hành lệnh cấm).
* `<Toast />`: Hộp thông báo kết quả nổi góc dưới màn hình, tự động biến mất sau 3 giây.

---

# CHƯƠNG 8: XỬ LÝ SỰ CỐ VÀ CÂU HỎI THƯỜNG GẶP (TROUBLESHOOTING & FAQ)

### Câu hỏi 1: Tôi nhấn nút "Đăng nhập" nhưng trang báo lỗi mạng hoặc quay vô tận?
* **Nguyên nhân:** Dịch vụ Backend .NET 8 chưa được khởi chạy hoặc SQL Server đang bị dừng dịch vụ.
* **Cách khắc phục:**
  1. Mở Terminal kiểm tra xem tiến trình `dotnet run` ở thư mục `SWP.API` có đang chạy tại cổng `5214` không.
  2. Mở `services.msc` trên Windows kiểm tra dịch vụ `SQL Server (MSSQLSERVER)` có đang ở trạng thái `Running` hay không.

### Câu hỏi 2: Tại sao Huấn luyện viên không thể tạo giáo án cho một con ngựa cụ thể?
* **Nguyên nhân:** Con ngựa đó đang bị Bác sĩ thú y áp dụng **Lệnh khóa huấn luyện (`TrainingLock`)** do chấn thương hoặc đang theo dõi dịch tễ.
* **Cách khắc phục:** Đăng nhập tài khoản Bác sĩ thú y (`vet@horseclub.test`), kiểm tra lại tình trạng bình phục của ngựa tại trang **Lệnh khóa huấn luyện** và thực hiện **"Gỡ lệnh khóa"** nếu ngựa đã đủ sức khỏe.

### Câu hỏi 3: Chủ ngựa vừa đăng ký tài khoản nhưng không đăng nhập được?
* **Nguyên nhân:** Khách hàng mới đăng ký tài khoản qua web công khai sẽ có trạng thái `Pending` (Chờ duyệt) nhằm kiểm soát danh tính chủ sở hữu.
* **Cách khắc phục:** Đăng nhập tài khoản Quản lý CLB (`manager@horseclub.test`), truy cập trang **Duyệt tài khoản (`/manager/approvals`)** và bấm nút **"Phê duyệt"** cho tài khoản đó.

### Câu hỏi 4: Khi chỉnh sửa mã nguồn giao diện, trình duyệt báo lỗi "Fast Refresh failed" hoặc màn hình trắng?
* **Nguyên nhân:** Cơ chế Hot Module Replacement (HMR) của trình duyệt nạp cache cũ khi file đang được ghi đĩa.
* **Cách khắc phục:** Nhấn tổ hợp phím `Ctrl + F5` (hoặc `Cmd + Shift + R` trên Mac) để xóa sạch cache trình duyệt và tải lại trang.

### Câu hỏi 5: Ảnh ngựa tải lên từ máy tính có bị mất khi chạy trên máy khác không?
* **Giải đáp:** Không. Khi bạn tải ảnh lên qua form quản lý ngựa, ảnh sẽ được đẩy trực tiếp lên dịch vụ lưu trữ đám mây **Cloudinary** và trả về đường dẫn URL vĩnh viễn lưu vào SQL Server. Vì vậy hình ảnh luôn sẵn sàng hiển thị trên mọi máy tính và thiết bị di động có kết nối internet.

### Câu hỏi 6: Hệ thống có hỗ trợ hiển thị tốt trên màn hình máy tính bảng (Tablet) không?
* **Giải đáp:** Toàn bộ giao diện đã được xây dựng theo chuẩn Responsive Design với Tailwind CSS:
  - Sidebar bên trái có nút thu gọn ("Thu gọn").
  - Các bảng dữ liệu hỗ trợ co giãn theo tỷ lệ `table-fixed`.
  - Hộp thoại sự cố tự động chuyển đổi giữa Drawer trượt và Center Dialog tùy theo độ phân giải màn hình.

---

# PHỤ LỤC A: ĐẶC TẢ DTO VÀ CẤU TRÚC JSON PAYLOAD CỦA CÁC API CỐT LÕI

Dưới đây là đặc tả chi tiết các gói tin JSON gửi và nhận qua HTTP giữa Frontend và Backend ASP.NET Core:

### A.1. API Đăng nhập (`POST /api/auth/login`)
* **Request Payload:**
```json
{
  "email": "trainer@horseclub.test",
  "password": "Password123!"
}
```
* **Response Payload (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "email": "trainer@horseclub.test",
      "fullName": "Nguyễn Minh Quân",
      "role": "head_trainer",
      "phoneNumber": "0912345678",
      "mustChangePassword": false
    }
  }
}
```

### A.2. API Khởi tạo Giáo án Huấn luyện (`POST /api/trainer/training-plans`)
* **Request Payload:**
```json
{
  "horseId": 3,
  "mucTieu": "Rèn luyện sức bền và bứt tốc cự ly 1600m",
  "ngayBatDau": "2026-11-20",
  "ngayKetThuc": "2027-01-15",
  "cuongDo": "Trung bình",
  "ghiChu": "Tập trung nhịp thở giai đoạn chuyển tiếp, cẩn thận mặt sân ướt"
}
```
* **Response Payload (HTTP 201 Created):**
```json
{
  "planId": 14,
  "horseId": 3,
  "horseName": "Ruby Storm",
  "trainerId": 2,
  "trainerName": "Nguyễn Minh Quân",
  "mucTieu": "Rèn luyện sức bền và bứt tốc cự ly 1600m",
  "ngayBatDau": "2026-11-20",
  "ngayKetThuc": "2027-01-15",
  "cuongDo": "Trung bình",
  "trangThai": "Draft",
  "createdAt": "2026-11-18T10:15:30Z"
}
```

### A.3. API Sinh lịch tập tuần tự động (`POST /api/trainer/training-plans/{id}/weekly-schedule`)
* **Request Payload:**
```json
{
  "groomId": 4,
  "sessionsPerWeek": 5,
  "restDays": ["Wednesday", "Sunday"],
  "defaultDurationMinutes": 45,
  "targetDistanceKm": 6.5
}
```
* **Response Payload (HTTP 200 OK):**
```json
{
  "planId": 14,
  "totalSessionsCreated": 40,
  "startDate": "2026-11-20",
  "endDate": "2027-01-15",
  "assignedGroom": "Lê Hoàng Nam",
  "sessions": [
    {
      "sessionId": 101,
      "ngayTap": "2026-11-20",
      "baiTap": "Chạy khởi động việt dã 5km",
      "quangDuong": 5.0,
      "thoiGian": 45.0,
      "trangThai": "Scheduled"
    },
    {
      "sessionId": 102,
      "ngayTap": "2026-11-21",
      "baiTap": "Bài tập tăng tốc 400m x 4 lượt",
      "quangDuong": 6.0,
      "thoiGian": 40.0,
      "trangThai": "Scheduled"
    }
  ]
}
```

### A.4. API Nài ngựa nộp kết quả buổi tập (`POST /api/groom/training-sessions/{id}/report`)
* **Request Payload:**
```json
{
  "quangDuongThucTe": 5.2,
  "thoiGianThucTe": 43.5,
  "nhipTimSauTap": 122,
  "groomNotes": "Ngựa phản ứng tốt, nhịp thở đều ở vòng 3, không có dấu hiệu khập khiễng."
}
```
* **Response Payload (HTTP 200 OK):**
```json
{
  "sessionId": 101,
  "trangThai": "Reported",
  "quangDuong": 5.2,
  "thoiGian": 43.5,
  "nhipTim": 122,
  "reportedAt": "2026-11-20T08:45:00Z",
  "reportedBy": "Lê Hoàng Nam"
}
```

### A.5. API Bác sĩ lập hồ sơ khám bệnh (`POST /api/vet/medical-records`)
* **Request Payload:**
```json
{
  "horseId": 3,
  "ngay": "2026-11-18",
  "chanDoan": "Giãn nhẹ dây chằng cổ chân sau bên phải",
  "ketQuaKham": "Có bất thường",
  "viTriChanThuong": "Khớp cổ chân sau bên phải",
  "phacDo": "Chườm lạnh 3 lần/ngày, quấn băng đàn hồi, nghỉ ngơi tĩnh 7 ngày, bôi gel chống viêm.",
  "autoLockTraining": true,
  "lockReason": "Tạm dừng vận động mạnh để hồi phục dây chằng cổ chân"
}
```
* **Response Payload (HTTP 201 Created):**
```json
{
  "recordId": 25,
  "horseId": 3,
  "horseName": "Ruby Storm",
  "vetName": "Trần Thu Hà",
  "ngay": "2026-11-18",
  "chanDoan": "Giãn nhẹ dây chằng cổ chân sau bên phải",
  "ketQuaKham": "Có bất thường",
  "viTriChanThuong": "Khớp cổ chân sau bên phải",
  "phacDo": "Chườm lạnh 3 lần/ngày, quấn băng đàn hồi, nghỉ ngơi tĩnh 7 ngày.",
  "createdLock": {
    "lockId": 8,
    "ngayDat": "2026-11-18",
    "trangThai": "Active",
    "lyDo": "Tạm dừng vận động mạnh để hồi phục dây chằng cổ chân"
  }
}
```

### A.6. API Gỡ Lệnh khóa huấn luyện (`POST /api/vet/training-locks/{id}/release`)
* **Request Payload:**
```json
{
  "trangThai": "Released"
}
```
* **Response Payload (HTTP 200 OK):**
```json
{
  "lockId": 8,
  "horseId": 3,
  "horseName": "Ruby Storm",
  "trangThai": "Released",
  "ngayMo": "2026-11-25",
  "releasedBy": "Trần Thu Hà",
  "message": "Đã dỡ bỏ lệnh cấm tập, chiến mã chuyển sang trạng thái Đủ điều kiện."
}
```

### A.7. API Báo cáo sự cố chuồng trại (`POST /api/groom/incidents`)
* **Request Payload:**
```json
{
  "horseId": 1,
  "ngay": "2026-11-18T16:30:00",
  "loaiSuCo": "Vết thương",
  "moTa": "Ngựa va chân vào bản lề cửa chuồng, trầy xước ngoài da dài 5cm ở đùi trước, rỉ máu nhẹ.",
  "hinhAnh": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA..."
}
```
* **Response Payload (HTTP 201 Created):**
```json
{
  "reportId": 12,
  "horseId": 1,
  "horseName": "Blue Horizon",
  "soChuong": "A-02",
  "groomName": "Lê Hoàng Nam",
  "ngay": "2026-11-18T16:30:00",
  "loaiSuCo": "Vết thương",
  "moTa": "Ngựa va chân vào bản lề cửa chuồng...",
  "hinhAnh": "https://res.cloudinary.com/horseclub/image/upload/v179499/incident_12.jpg",
  "trangThai": "Mới",
  "handledBy": null,
  "handledAt": null
}
```

---

# PHỤ LỤC B: MA TRẬN PHÂN QUYỀN CRUD CHI TIẾT (RBAC MATRIX)

Ký hiệu:
* **C (Create):** Quyền tạo mới bản ghi.
* **R (Read):** Quyền đọc / xem dữ liệu.
* **U (Update):** Quyền chỉnh sửa bản ghi.
* **D (Delete):** Quyền xóa bản ghi.
* **A (Approve):** Quyền phê duyệt nghiệp vụ.
* **- (None):** Không có quyền truy cập.

| Thực thể / Chức năng | Club Manager | Head Trainer | Veterinarian | Groom | Horse Owner |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Hồ sơ ngựa (Horses)** | C / R / U / D | R | R | R | R (Chỉ ngựa của mình) |
| **Duyệt tài khoản chủ ngựa** | R / A | - | - | - | - |
| **Nhân sự CLB (Staff)** | C / R / U / D | - | - | - | - |
| **Giáo án huấn luyện (Plans)** | R | C / R / U / D | R | R | R / A (Duyệt giáo án) |
| **Buổi tập huấn luyện (Sessions)**| R | C / R / U / A | R | R / U (Nộp số liệu)| R (Xem đánh giá) |
| **Bệnh án y tế (Medical Records)**| R | R | C / R / U | R (Xem tóm tắt)| R (Chỉ ngựa của mình) |
| **Lệnh khóa huấn luyện (Locks)** | R | R | C / R / U (Gỡ khóa)| - | R (Xem thông báo) |
| **Lịch tiêm phòng (Vaccinations)**| R | R | C / R / U | - | R (Xem lịch tiêm) |
| **Nhiệm vụ chuồng trại (Tasks)** | R | - | - | R / U (Hoàn thành)| - |
| **Sự cố chuồng & Y tế (Incidents)**| R / U (Xử lý hạ tầng)| - | R / U (Xử lý y tế)| C / R (Tạo báo cáo)| - |
| **Giải đua (Races)** | C / R / U | R | R | R | R |
| **Duyệt đăng ký thi đấu** | R / A (Cấp 3) | C / R / A (Cấp 1)| - | - | R / A (Cấp 2) |
| **Vật tư kho (Supplies)** | C / R / U / D | R | R | R | - |
| **Nhật ký kiểm toán (Audit Log)**| R | - | - | - | - |

---

# PHỤ LỤC C: CẤU TRÚC TỔ CHỨC THƯ MỤC DỰ ÁN (PROJECT REPOSITORY TREE)

### C.1. Frontend Architecture (`racehorse-training-management-FE`)
```
racehorse-training-management-FE/
├── public/                     # Tài nguyên tĩnh công khai (logo, favicon)
├── src/
│   ├── assets/                 # Hình ảnh minh họa dự phòng (spirit, blaze, storm...)
│   ├── components/             # Các Component tái sử dụng toàn hệ thống
│   │   ├── CenterDialog.jsx    # Hộp thoại modal giữa màn hình (Header-Body-Footer)
│   │   ├── ConfirmDialog.jsx   # Popup xác nhận hành động nguy hiểm
│   │   ├── Drawer.jsx          # Ngăn kéo trượt từ phải sang (bên hông)
│   │   ├── Header.jsx          # Header hệ thống (Breadcrumbs + Badge vai trò)
│   │   ├── HorseAvatar.jsx     # Avatar chiến mã bo tròn/vuông kèm fallback
│   │   ├── HorseCard.jsx       # Thẻ tóm tắt thông tin chiến mã
│   │   ├── IncidentDetailDialog.jsx # Modal chi tiết sự cố cho Vet/Manager
│   │   ├── IncidentRow.jsx     # Dòng dữ liệu sự cố trong bảng chung
│   │   ├── IncidentStatusBadge.jsx  # Huy hiệu trạng thái sự cố có chấm màu
│   │   ├── IncidentTable.jsx   # Bảng danh sách sự cố có bộ lọc và thống kê
│   │   ├── Layout.jsx          # Khung trang chính bọc Sidebar và Content
│   │   ├── LoadingState.jsx    # Hiệu ứng chờ tải dữ liệu
│   │   ├── Sidebar.jsx         # Thanh điều hướng trái theo vai trò
│   │   ├── TablePager.jsx      # Thanh phân trang chuẩn
│   │   └── Toast.jsx           # Thông báo nổi góc màn hình
│   ├── data/                   # Định nghĩa hằng số và lựa chọn dropdown
│   │   ├── incidentOptions.js  # Lựa chọn loại sự cố, trạng thái, kích thước ảnh
│   │   └── medicalRecordOptions.js # Lựa chọn kết quả khám, phân loại bệnh án
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useAuth.js          # Hook truy xuất thông tin tài khoản hiện tại
│   │   └── useHorseRealtime.js # Hook lắng nghe sự kiện SignalR từ Backend
│   ├── pages/                  # Các màn hình phân theo vai trò
│   │   ├── auth/               # Đăng nhập, Đăng ký, Đổi mật khẩu
│   │   ├── common/             # ClubDashboard.jsx (Dùng chung 3 vai trò)
│   │   ├── groom/              # Nhiệm vụ chuồng, Sơ đồ, Báo cáo sự cố, Buổi tập
│   │   ├── manager/            # Hồ sơ ngựa, Duyệt tài khoản, Nhân sự, Vật tư, Audit
│   │   ├── owner/              # Ngựa của tôi, Sức khỏe, Lịch trình, Giải đua, Tài chính
│   │   ├── trainer/            # Giáo án, Buổi tập, Giải đua, Sinh lịch tập tuần
│   │   └── vet/                # Khám bệnh, Lệnh khóa, Tiêm phòng, Sự cố y tế
│   ├── routes/                 # Quản lý định tuyến và menu phân quyền
│   │   ├── ProtectedRoute.jsx  # Bảo vệ URL theo vai trò
│   │   └── roleMenus.js        # Cấu hình danh mục menu trái của từng Role
│   ├── services/               # Tầng giao tiếp API (Axios Client)
│   │   ├── apiClient.js        # Cấu hình Axios gán Bearer Token tự động
│   │   ├── auditService.js     # API nhật ký hệ thống
│   │   ├── careService.js      # API chăm sóc, chuồng trại và sự cố
│   │   ├── horseService.js     # API hồ sơ ngựa và ảnh Cloudinary
│   │   ├── trainingApi.js      # API giáo án và buổi tập của HLV
│   │   └── vetService.js       # API bệnh án, lệnh khóa và tiêm phòng
│   ├── styles/
│   │   └── index.css           # Cấu hình Tailwind v4, CSS biến màu và zoom tỉ lệ
│   ├── utils/                  # Hàm tiện ích xử lý chuỗi, ngày tháng, định dạng
│   ├── App.jsx                 # Bộ định tuyến toàn cục React Router
│   └── main.jsx                # Điểm khởi chạy ứng dụng React
├── package.json                # Khai báo thư viện và script npm
└── vite.config.js              # Cấu hình máy chủ phát triển Vite và Proxy API
```

### C.2. Backend Architecture (`BE_Horse_Training`)
```
BE_Horse_Training/
├── SWP.API/                    # Tầng giao diện RESTful API & SignalR
│   ├── Controllers/            # Bộ điều khiển tiếp nhận HTTP Request
│   │   ├── AuthController.cs   # Xác thực, cấp JWT token
│   │   ├── HorsesController.cs # Quản lý thông tin chiến mã
│   │   ├── ManagerController.cs# Nghiệp vụ Quản lý CLB
│   │   ├── TrainerController.cs# Nghiệp vụ Huấn luyện viên
│   │   ├── VetController.cs    # Nghiệp vụ Thú y, Bệnh án, Khóa tập
│   │   ├── GroomController.cs  # Nghiệp vụ Chăm sóc chuồng trại
│   │   └── ApprovalsController.cs # Phê duyệt đa cấp (Giáo án, Giải đua)
│   ├── Realtime/               # SignalR Hubs và Notifier thời gian thực
│   │   ├── HorseHub.cs         # Hub kết nối WebSocket
│   │   └── HorseRealtimeNotifier.cs # Phát sự kiện tới các Client
│   ├── Program.cs              # Cấu hình Middleware, DI container, Pipeline
│   └── appsettings.json        # Chuỗi kết nối SQL Server, Cloudinary, JWT Secret
├── SWP.Application/            # Tầng ứng dụng: Xử lý nghiệp vụ (Business Logic)
│   ├── DTOs/                   # Data Transfer Objects cho Request và Response
│   ├── Interfaces/             # Contracts cho các Service
│   └── Services/               # Triển khai chi tiết logic bài toán
├── SWP.Domain/                 # Tầng thực thể nghiệp vụ cốt lõi (Core Entities)
│   ├── Entities/               # Các Model: Horse, User, TrainingPlan, Incident...
│   └── Enums/                  # Các kiểu liệt kê: RoleNames, IncidentTypes...
└── SWP.Infrastructure/         # Tầng hạ tầng dữ liệu và tích hợp bên thứ ba
    ├── Data/                   # DbContext và cấu hình Fluent API mapping
    │   ├── HorseDbContext.cs   # Entity Framework Core DbContext
    │   └── Configurations/     # Cấu hình bảng: HorseConfiguration, LockConfig...
    └── Repositories/           # Mẫu thiết kế Generic Repository
```

---

# PHỤ LỤC D: CHECKLIST TỰ KIỂM TRA TRƯỚC KHI BẢO VỆ ĐỒ ÁN (DEFENSE READINESS CHECKLIST)

Bảng kiểm này giúp các thành viên nhóm rà soát toàn bộ các tiêu chí trước buổi báo cáo đồ án tốt nghiệp / bảo vệ môn học:

- [x] **1. Cơ sở dữ liệu:**
  - [x] Database `Horse_managerment` đã nạp đầy đủ dữ liệu mồi (Seed Data) chuẩn.
  - [x] Các cột ngày tháng (`CreatedAt`, `NgayDat`) có giá trị mặc định tránh lỗi NULL.
  - [x] Cột `Gender` hỗ trợ `NVARCHAR(20)` hiển thị tiếng Việt có dấu (`Ngựa đực`, `Ngựa cái`).
  - [x] Không còn các bản ghi bị nhân bản (duplicate rows) trong bảng User và Horse.
- [x] **2. Backend API (.NET 8):**
  - [x] Lệnh `dotnet build` và `dotnet run` chạy mượt mà không có lỗi cảnh báo nghiêm trọng.
  - [x] Toàn bộ 5 Controller được phân quyền chính xác bằng `[Authorize(Roles = "...")]`.
  - [x] Swagger UI hiển thị đầy đủ và có thể thử nghiệm trực tiếp các Endpoint.
  - [x] SignalR Hub sẵn sàng kết nối tại `/horseHub`.
- [x] **3. Frontend Web App (React 18 + Vite):**
  - [x] Lệnh `npm run build` vượt qua 100% trong dưới 500ms (0 lỗi cú pháp / 0 lỗi import).
  - [x] Proxy cấu hình trong `vite.config.js` chuyển tiếp mượt mà `/api` sang cổng `5214`.
  - [x] Bảng điều khiển tổng hợp `ClubDashboard.jsx` hiển thị số liệu thực tế cho Manager, Trainer và Vet.
  - [x] Toàn bộ 21 màn hình có giao diện full-width chuẩn, viền thẻ sắc nét và tiêu đề viết hoa Title Case.
  - [x] Cơ chế Fallback ảnh đảm bảo không bao giờ bị vỡ khung hình khi mất mạng ngoài.
- [x] **4. Ràng buộc nghiệp vụ chéo:**
  - [x] Ngựa bị Bác sĩ thú y khóa tập $\rightarrow$ HLV không thể lên lịch tập hoặc đăng ký giải đua.
  - [x] Ngựa đã có bệnh án / giáo án $\rightarrow$ Quản lý không thể bấm xóa để bảo toàn dữ liệu.
  - [x] Báo cáo sự cố chuồng trại gửi lên $\rightarrow$ Cả Bác sĩ và Quản lý đều nhận diện đúng loại sự cố để xử lý.
  - [x] Quy trình đăng ký giải đua bắt buộc đủ 3 cấp phê duyệt (HLV $\rightarrow$ Chủ $\rightarrow$ Quản lý).

---
*Tài liệu được biên soạn và chuẩn hóa phục vụ công tác nghiệm thu và vận hành Hệ thống Quản lý Huấn luyện Ngựa Đua EquiTrack.*
