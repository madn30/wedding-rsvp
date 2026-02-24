import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { FullPageLoader } from '../components/ui';

export const AdminLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
