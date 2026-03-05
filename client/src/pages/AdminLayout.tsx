import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { FullPageLoader } from "../components/ui";

export const AdminLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div dir="rtl" className="flex min-h-[100dvh] bg-[#111827]">
      {}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d1b2a]/90 px-4 shadow-sm backdrop-blur-md md:hidden text-white">
        <div className="flex items-center gap-2 font-serif text-base font-semibold text-[#e8c97e]">
          <span aria-hidden="true">💍</span>
          ניהול הזמנות
        </div>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-md transition-colors hover:bg-white/5"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "סגור תפריט" : "פתח תפריט"}
          aria-expanded={sidebarOpen}
        >
          <span
            className={`h-0.5 w-[22px] rounded-sm bg-white transition-all ${sidebarOpen ? "rotate-45 translate-y-[7px]" : ""}`}
          />

          <span
            className={`h-0.5 w-[22px] rounded-sm bg-white transition-opacity ${sidebarOpen ? "opacity-0" : "opacity-100"}`}
          />

          <span
            className={`h-0.5 w-[22px] rounded-sm bg-white transition-all ${sidebarOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>
      </header>

      {}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 md:pr-64 transition-all duration-300">
        {}
        <main className="flex-1 overflow-auto pt-16 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
