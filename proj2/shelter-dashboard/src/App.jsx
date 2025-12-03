import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PendingPage from "./pages/PendingPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";

function AppLayout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <div className="app-main">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pending-orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PendingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/order-history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* default -> dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
