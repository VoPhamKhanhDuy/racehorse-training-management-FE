import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import PlaceholderPage from "./components/PlaceholderPage";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AccountStatus from "./pages/auth/AccountStatus";
import MyHorses from "./pages/owner/MyHorses";
import OwnerHorseProfile from "./pages/owner/OwnerHorseProfile";
import OwnerHealth from "./pages/owner/OwnerHealth";
import OwnerSchedule from "./pages/owner/OwnerSchedule";
import OwnerFinance from "./pages/owner/OwnerFinance";
import ChangePassword from "./pages/auth/ChangePassword";
import AccountApprovals from "./pages/manager/AccountApprovals";
import CreateStaffAccount from "./pages/manager/CreateStaffAccount";
import HorseManagement from "./pages/manager/HorseManagement";
import HorseForm from "./pages/manager/HorseForm";
import StaffManagement from "./pages/manager/StaffManagement";
import SupplyManagement from "./pages/manager/SupplyManagement";
import SupplyForm from "./pages/manager/SupplyForm";
import Reports from "./pages/manager/Reports";
import ManagerIncidents from "./pages/manager/ManagerIncidents";
import AuditLog from "./pages/manager/AuditLog";
import ManagerFinance from "./pages/manager/ManagerFinance";
import TrainingPlans from "./pages/trainer/TrainingPlans";
import TrainingPlanForm from "./pages/trainer/TrainingPlanForm";
import TrainingPlanDetail from "./pages/trainer/TrainingPlanDetail";
import WeeklyScheduleGenerator from "./pages/trainer/WeeklyScheduleGenerator";
import Schedule from "./pages/trainer/Schedule";
import TrainingSessions from "./pages/trainer/TrainingSessions";
import TrainingSessionForm from "./pages/trainer/TrainingSessionForm";
import SessionResultForm from "./pages/trainer/SessionResultForm";
import Races from "./pages/trainer/Races";
import HorseProfiles from "./pages/trainer/HorseProfiles";
import HorseProfile from "./pages/trainer/HorseProfile";
import MedicalExams from "./pages/vet/MedicalExams";
import MedicalExamForm from "./pages/vet/MedicalExamForm";
import HealthOverview from "./pages/vet/HealthOverview";
import VetIncidents from "./pages/vet/VetIncidents";
import GroomTasks from "./pages/groom/GroomTasks";
import StableMap from "./pages/groom/StableMap";
import IncidentReports from "./pages/groom/IncidentReports";
import IncidentReportForm from "./pages/groom/IncidentReportForm";
import GroomSupplies from "./pages/groom/GroomSupplies";
import TrainingAssignments from "./pages/groom/TrainingAssignments";
import TrainingLocks from "./pages/vet/TrainingLocks";
import TrainingLockForm from "./pages/vet/TrainingLockForm";
import Vaccinations from "./pages/vet/Vaccinations";
import VaccinationForm from "./pages/vet/VaccinationForm";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Màn trạng thái tài khoản (sau Đăng ký / Đăng nhập khi chờ duyệt, bị từ chối) */}
      <Route path="/account-status" element={<AccountStatus />} />
      {/* URL cũ của màn Đã gửi đăng ký (đã đổi thành /account-status): không còn state → về Đăng nhập */}
      <Route path="/pending-approval" element={<Navigate to="/login" replace />} />
      {/* Đổi mật khẩu lần đầu: trang tự kiểm tra đăng nhập + cờ mustChangePassword */}
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Head Trainer */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["head_trainer"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/trainer" element={<Navigate to="/trainer/plans" replace />} />
        {/* Giáo án, lịch tập, buổi tập: nối API thật (services/trainingApi.js) */}
        <Route path="/trainer/plans" element={<TrainingPlans />} />
        <Route path="/trainer/plans/new" element={<TrainingPlanForm />} />
        <Route path="/trainer/plans/:id" element={<TrainingPlanDetail />} />
        <Route path="/trainer/plans/:id/edit" element={<TrainingPlanForm />} />
        <Route path="/trainer/plans/:id/weekly-schedule" element={<WeeklyScheduleGenerator />} />
        <Route path="/trainer/plans/:planId/sessions/new" element={<TrainingSessionForm />} />
        <Route path="/trainer/schedule" element={<Schedule />} />
        <Route path="/trainer/sessions" element={<TrainingSessions />} />
        {/* URL cũ (luồng mock) — thay bằng luồng giáo án nối API: thêm buổi tập qua /trainer/plans/:planId/sessions/new */}
        <Route path="/trainer/schedule/new" element={<Navigate to="/trainer/schedule" replace />} />
        <Route path="/trainer/schedule/:id/edit" element={<Navigate to="/trainer/schedule" replace />} />
        <Route path="/trainer/sessions/new" element={<Navigate to="/trainer/sessions" replace />} />
        <Route path="/trainer/sessions/:id/edit" element={<TrainingSessionForm />} />
        <Route path="/trainer/sessions/:id/result" element={<SessionResultForm />} />
        <Route path="/trainer/races" element={<Races />} />
        {/* Hồ sơ ngựa: chỉ xem */}
        <Route path="/trainer/horses" element={<HorseProfiles />} />
        <Route path="/trainer/horses/:id" element={<HorseProfile />} />
        <Route path="/trainer/*" element={<PlaceholderPage />} />
      </Route>

      {/* Veterinarian */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["veterinarian"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Trang đích của bác sĩ thú y sau khi đăng nhập */}
        <Route path="/vet" element={<Navigate to="/vet/overview" replace />} />
        <Route path="/vet/overview" element={<HealthOverview />} />
        <Route path="/vet/exams" element={<MedicalExams />} />
        <Route path="/vet/exams/new" element={<MedicalExamForm />} />
        <Route path="/vet/exams/:id/edit" element={<MedicalExamForm />} />
        <Route path="/vet/incidents" element={<VetIncidents />} />
        <Route path="/vet/locks" element={<TrainingLocks />} />
        <Route path="/vet/locks/new" element={<TrainingLockForm />} />
        <Route path="/vet/vaccinations" element={<Vaccinations />} />
        <Route path="/vet/vaccinations/new" element={<VaccinationForm />} />
        <Route path="/vet/vaccinations/:id/edit" element={<VaccinationForm />} />
        <Route path="/vet/*" element={<PlaceholderPage />} />
      </Route>

      {/* Groom / Stable Hand */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["groom"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Trang đích của nhân viên chăm sóc sau khi đăng nhập */}
        <Route path="/groom" element={<Navigate to="/groom/tasks" replace />} />
        <Route path="/groom/tasks" element={<GroomTasks />} />
        <Route path="/groom/stable" element={<StableMap />} />
        <Route path="/groom/incidents" element={<IncidentReports />} />
        <Route path="/groom/incidents/new" element={<IncidentReportForm />} />
        <Route path="/groom/supplies" element={<GroomSupplies />} />
        <Route path="/groom/training" element={<TrainingAssignments />} />
        <Route path="/groom/*" element={<PlaceholderPage />} />
      </Route>

      {/* Horse Owner */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["horse_owner"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/owner" element={<Navigate to="/owner/horses" replace />} />
        <Route path="/owner/horses" element={<MyHorses />} />
        <Route path="/owner/horses/:id" element={<OwnerHorseProfile />} />
        <Route path="/owner/health" element={<OwnerHealth />} />
        <Route path="/owner/schedule" element={<OwnerSchedule />} />
        <Route path="/owner/finance" element={<OwnerFinance />} />
        <Route path="/owner/*" element={<PlaceholderPage />} />
      </Route>

      {/* Club Manager */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["club_manager"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/manager" element={<Navigate to="/manager/horses" replace />} />
        <Route path="/manager/horses" element={<HorseManagement />} />
        <Route path="/manager/horses/new" element={<HorseForm />} />
        <Route path="/manager/horses/:id/edit" element={<HorseForm />} />
        <Route path="/manager/approvals" element={<AccountApprovals />} />
        <Route path="/manager/finance" element={<ManagerFinance />} />
        <Route path="/manager/staff" element={<StaffManagement />} />
        <Route path="/manager/staff/new" element={<CreateStaffAccount />} />
        <Route path="/manager/staff/:id/edit" element={<CreateStaffAccount />} />
        <Route path="/manager/supplies" element={<SupplyManagement />} />
        <Route path="/manager/supplies/new" element={<SupplyForm />} />
        <Route path="/manager/supplies/:id/edit" element={<SupplyForm />} />
        <Route path="/manager/incidents" element={<ManagerIncidents />} />
        <Route path="/manager/reports" element={<Reports />} />
        <Route path="/manager/audit-log" element={<AuditLog />} />
        <Route path="/manager/*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
