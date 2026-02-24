import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: '📊', label: 'לוח בקרה' },
  { to: '/admin/guests', icon: '👥', label: 'אורחים' },
];

export const AdminSidebar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-l border-gray-100 shadow-sm flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="text-center">
          <span className="text-3xl">💍</span>
          <h1 className="font-serif text-lg font-semibold text-gray-800 mt-1">
            ניהול הזמנות
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{admin?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150"
        >
          <span>🚪</span>
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  );
};
