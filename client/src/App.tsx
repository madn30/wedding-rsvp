import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout }   from './pages/AdminLayout';
import { LoginPage }     from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GuestsPage }    from './pages/GuestsPage';
import { RSVPPage }      from './pages/RSVPPage';

const App = () => (
  <AuthProvider>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
        success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } },
        error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
      }}
    />
    <Routes>
      {/* Public – RSVP */}
      <Route path="/rsvp/:token" element={<RSVPPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="guests"    element={<GuestsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="/"  element={<Navigate to="/admin/login" replace />} />
      <Route path="*"  element={<Navigate to="/admin/login" replace />} />
    </Routes>
  </AuthProvider>
);

export default App;
