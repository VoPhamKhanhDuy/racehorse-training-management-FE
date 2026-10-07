import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PendingApproval from "./pages/auth/PendingApproval";
import CreateStaffAccount from "./pages/manager/CreateStaffAccount";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route
        path="/manager/staff/new"
        element={
          <ProtectedRoute allowedRoles={["club_manager"]}>
            <CreateStaffAccount />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
