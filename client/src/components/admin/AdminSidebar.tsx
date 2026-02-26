import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import s from './AdminSidebar.module.css';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: '📊', label: 'לוח בקרה' },
  { to: '/admin/guests',    icon: '👥', label: 'אורחים'   },
];

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className={`${s.sidebar} ${isOpen ? s.sidebarOpen : ''}`}>
      {/* Brand */}
      <div className={s.brand}>
        <span className={s.brandIcon}>💍</span>
        <strong className={s.brandTitle}>ניהול הזמנות</strong>
        {admin?.email && <span className={s.brandEmail}>{admin.email}</span>}
      </div>

      {/* Navigation */}
      <nav className={s.nav} aria-label="תפריט ניהול">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `${s.navLink} ${isActive ? s.navLinkActive : ''}`
            }
          >
            <span className={s.navIcon} aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <footer className={s.footer}>
        <button className={s.logoutBtn} onClick={handleLogout}>
          <span className={s.logoutIcon} aria-hidden="true">🚪</span>
          התנתקות
        </button>
      </footer>
    </aside>
  );
};
