import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSyncApiToken } from './hooks/useApi';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/dashboard/Overview';
import ApiKeys from './pages/dashboard/ApiKeys';
import Sessions from './pages/dashboard/Sessions';
import Usage from './pages/dashboard/Usage';
import Settings from './pages/dashboard/Settings';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  // Sync the in-memory API token when auth state changes
  useSyncApiToken();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
      <Route
        path="/dashboard/overview"
        element={
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/keys"
        element={
          <ProtectedRoute>
            <ApiKeys />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/sessions"
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/usage"
        element={
          <ProtectedRoute>
            <Usage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
