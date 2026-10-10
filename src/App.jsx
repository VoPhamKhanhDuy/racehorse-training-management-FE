import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import PlaceholderPage from "./components/PlaceholderPage";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PendingApproval from "./pages/auth/PendingApproval";
import ChangePassword from "./pages/auth/ChangePassword";
import AccountApprovals from "./pages/manager/AccountApprovals";
import CreateStaffAccount from "./pages/manager/CreateStaffAccount";
import HorseManagement from "./pages/manager/HorseManagement";
import HorseForm from "./pages/manager/HorseForm";
import StaffManagement from "./pages/manager/StaffManagement";
import SupplyManagement from "./pages/manager/SupplyManagement";
import SupplyForm from "./pages/manager/SupplyForm";
import Reports from "./pages/manager/Reports";
import AuditLog from "./pages/manager/AuditLog";
import TrainingPlans from "./pages/trainer/TrainingPlans";
import TrainingPlanForm from "./pages/trainer/TrainingPlanForm";
import Schedule from "./pages/trainer/Schedule";
import ScheduleForm from "./pages/trainer/ScheduleForm";
import TrainingSessions from "./pages/trainer/TrainingSessions";
import TrainingSessionForm from "./pages/trainer/TrainingSessionForm";
import Races from "./pages/trainer/Races";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
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
        <Route path="/trainer/plans" element={<TrainingPlans />} />
        <Route path="/trainer/plans/new" element={<TrainingPlanForm />} />
        <Route path="/trainer/plans/:id/edit" element={<TrainingPlanForm />} />
        <Route path="/trainer/schedule" element={<Schedule />} />
        <Route path="/trainer/schedule/new" element={<ScheduleForm />} />
        <Route path="/trainer/schedule/:id/edit" element={<ScheduleForm />} />
        <Route path="/trainer/sessions" element={<TrainingSessions />} />
        <Route path="/trainer/sessions/new" element={<TrainingSessionForm />} />
        <Route path="/trainer/sessions/:id/edit" element={<TrainingSessionForm />} />
        <Route path="/trainer/races" element={<Races />} />
        {/* Hồ sơ ngựa (chỉ xem): tạm placeholder */}
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
        <Route path="/vet" element={<Navigate to="/vet/records" replace />} />
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
        <Route path="/groom" element={<Navigate to="/groom/stable-map" replace />} />
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
        <Route path="/manager/staff" element={<StaffManagement />} />
        <Route path="/manager/staff/new" element={<CreateStaffAccount />} />
        <Route path="/manager/staff/:id/edit" element={<CreateStaffAccount />} />
        <Route path="/manager/supplies" element={<SupplyManagement />} />
        <Route path="/manager/supplies/new" element={<SupplyForm />} />
        <Route path="/manager/supplies/:id/edit" element={<SupplyForm />} />
        <Route path="/manager/reports" element={<Reports />} />
        <Route path="/manager/audit-log" element={<AuditLog />} />
        <Route path="/manager/*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
