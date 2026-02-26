import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { FullPageLoader } from '../components/ui';
import s from './AdminLayout.module.css';

export const AdminLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className={s.layout}>
      {/* Mobile topbar */}
      <header className={s.topbar}>
        <div className={s.topbarBrand}>
          <span aria-hidden="true">💍</span>
          ניהול הזמנות
        </div>
        <button
          className={s.hamburger}
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label={sidebarOpen ? 'סגור תפריט' : 'פתח תפריט'}
          aria-expanded={sidebarOpen}
        >
          <span className={s.bar} />
          <span className={s.bar} />
          <span className={s.bar} />
        </button>
      </header>

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Page content */}
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  );
};
