import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEventContext } from "../../context/EventContext";
import {
  LayoutDashboard,
  Users,
  Armchair,
  LogOut,
  MessageSquare,
  CalendarClock,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "לוח בקרה",
  },
  { to: "/admin/guests", icon: <Users size={18} />, label: "אורחים" },
  { to: "/admin/seating", icon: <Armchair size={18} />, label: "סידורי הושבה" },
  {
    to: "/admin/message-center",
    icon: <MessageSquare size={18} />,
    label: "מרכז הודעות",
  },
  { to: "/admin/events", icon: <CalendarClock size={18} />, label: "אירועים" },
];

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { admin, logout } = useAuth();
  const { activeEvent } = useEventContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <>
      {}
      <div
        className={`fixed inset-0 z-40 bg-[#060a11]/70 backdrop-blur-md transition-all duration-500 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-64 
          bg-gradient-to-b from-[#0a1520] to-[#0d1b2a] 
          border-l border-[#c9a84c]/10 
          shadow-[0_0_40px_rgba(0,0,0,0.5)]
          flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
      >
        {}
        <div className="p-8 border-b border-white/5 flex flex-col items-center gap-3 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-32 bg-[#c9a84c]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative w-14 h-14 bg-gradient-to-br from-[#c9a84c]/20 to-transparent rounded-full flex items-center justify-center border border-[#c9a84c]/30 shadow-[0_0_15px_rgba(201,168,76,0.15)]">
            <span className="text-2xl drop-shadow-md">💍</span>
          </div>

          <div className="relative z-10 flex flex-col gap-0.5 mt-1">
            <strong className="text-[#e8c97e] font-serif text-xl tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              ניהול אירוע
            </strong>
            {admin?.email && (
              <span className="text-[10px] text-white/40 truncate w-full px-2 font-mono tracking-wider">
                {admin.email}
              </span>
            )}
          </div>
        </div>

        {}
        <nav
          className="flex-1 p-4 flex flex-col gap-2 mt-2"
          aria-label="תפריט ניהול"
        >
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <div key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out group overflow-hidden
                  ${
                    isActive
                      ? "bg-gradient-to-l from-[#c9a84c]/10 to-transparent text-[#e8c97e] font-semibold"
                      : "text-white/50 hover:bg-white/[0.03] hover:text-[#faf6ef] hover:-translate-x-1"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute right-0 top-2 bottom-2 w-1 bg-gradient-to-b from-[#c9a84c] to-[#e8c97e] rounded-l-md shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                    )}
                    <span
                      className={`shrink-0 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_5px_rgba(201,168,76,0.4)]" : "group-hover:scale-110 group-hover:text-white"}`}
                    >
                      {icon}
                    </span>
                    <span className="text-sm tracking-wide z-10">{label}</span>
                    {to === "/admin/events" && activeEvent && (
                      <span className="mr-auto shrink-0 w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
              {to === "/admin/events" && activeEvent && (
                <div className="px-4 pb-1 -mt-1 space-y-0.5">
                  <p className="text-[10px] text-[#c9a84c]/65 font-semibold truncate">
                    {activeEvent.name}
                  </p>
                  <p className="text-[9px] text-[#c9a84c]/35 font-mono">
                    {activeEvent.date.split("-").reverse().join(".")} ·{" "}
                    {activeEvent.startTime}
                  </p>
                </div>
              )}
            </div>
          ))}
        </nav>

        {}
        <footer className="p-4 border-t border-white/5 bg-[#060a11]/30">
          <button
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#f1948a]/80 border border-transparent hover:bg-[#f1948a]/10 hover:border-[#f1948a]/20 hover:text-[#f1948a] hover:shadow-[0_0_15px_rgba(241,148,138,0.1)] transition-all duration-300 group"
            onClick={handleLogout}
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform duration-300"
            />

            <span className="text-sm font-medium tracking-wide">
              התנתקות מערכת
            </span>
          </button>
        </footer>
      </aside>
    </>
  );
};
