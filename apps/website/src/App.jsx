import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSyncApiToken } from './hooks/useApi';
import { usePageView } from './hooks/usePageView';
import Landing from './pages/Landing';
import Docs from './pages/Docs';
import Blog from './pages/Blog';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import Overview from './pages/dashboard/Overview';
import ApiKeys from './pages/dashboard/ApiKeys';
import Connectors from './pages/dashboard/Connectors';
import Sessions from './pages/dashboard/Sessions';
import Usage from './pages/dashboard/Usage';
import Settings from './pages/dashboard/Settings';

const IllustrationDebugPage = lazy(() => import('./pages/dev/IllustrationDebugPage'));

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
  // Track page views on every route change (no-ops if GA not initialized)
  usePageView();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/docs/*" element={<Docs />} />
      <Route path="/blog/*" element={<Blog />} />
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
        path="/dashboard/connectors"
        element={
          <ProtectedRoute>
            <Connectors />
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
      {import.meta.env.DEV && (
        <Route
          path="/dev/illustrations"
          element={
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              <IllustrationDebugPage />
            </Suspense>
          }
        />
      )}
      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
