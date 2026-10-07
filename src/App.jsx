import { Routes, Route, Navigate, Link } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import PlaceholderPage from "./components/PlaceholderPage";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PendingApproval from "./pages/auth/PendingApproval";
import CreateStaffAccount from "./pages/manager/CreateStaffAccount";
import HorseManagement from "./pages/manager/HorseManagement";
import HorseForm from "./pages/manager/HorseForm";
import TrainingPlans from "./pages/trainer/TrainingPlans";
import Schedule from "./pages/trainer/Schedule";
import Dashboard from "./pages/trainer/Dashboard";
import Performance from "./pages/trainer/Performance";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-approval" element={<PendingApproval />} />

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
        <Route path="/trainer/schedule" element={<Schedule />} />
        <Route path="/trainer/dashboard" element={<Dashboard />} />
        <Route path="/trainer/performance" element={<Performance />} />
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
        <Route path="/manager/staff/new" element={<CreateStaffAccount />} />
        <Route
          path="/manager/staff"
          element={
            <PlaceholderPage>
              <Link
                to="/manager/staff/new"
                className="inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-orange-600"
              >
                Tạo tài khoản nhân sự
              </Link>
            </PlaceholderPage>
          }
        />
        <Route path="/manager/*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
