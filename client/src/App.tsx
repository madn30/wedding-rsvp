import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { EventProvider } from "./context/EventContext";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminLayout } from "./pages/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { GuestsPage } from "./pages/GuestsPage";
import { RSVPPage } from "./pages/RSVPPage";
import SeatingEngine from "./pages/SeatingEngine";
import { MessageCenterPage } from "./pages/MessageCenterPage";
import { EventsPage } from "./pages/EventsPage";

const App = () => (
  <EventProvider>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "12px",
          fontFamily: "var(--font-sans, Inter, sans-serif)",
          fontSize: "14px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
        success: {
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
        },
      }}
    />

    <Routes>
      <Route path="/rsvp/:token" element={<RSVPPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="events" element={<EventsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="seating" element={<SeatingEngine />} />
          <Route path="message-center" element={<MessageCenterPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  </EventProvider>
);

export default App;
