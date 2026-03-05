import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEventContext } from '../../context/EventContext';

export const ProtectedRoute = () => {
  const { isLoading: authLoading } = useAuth();
  const { events, isLoading: eventsLoading } = useEventContext();

  // Show spinner while auth token is being verified OR events are loading.
  // Redirecting during auth init causes a false "no events" state.
  if (authLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return <Navigate to="/admin/events" replace />;
  }

  return <Outlet />;
};
