import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  DBEvent,
  EventPayload,
  apiGetEvents,
  apiCreateEvent,
  apiUpdateEvent,
  apiDeleteEvent,
  apiSetActiveEvent,
} from '../services/eventService';

interface EventContextType {
  events: DBEvent[];
  activeEvent: DBEvent | null;
  isLoading: boolean;
  setActiveEvent: (event: DBEvent | null) => Promise<void>;
  createEvent: (payload: EventPayload) => Promise<DBEvent>;
  updateEvent: (id: string, payload: Partial<EventPayload>) => Promise<DBEvent>;
  deleteEvent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const EventContext = createContext<EventContextType>({
  events: [],
  activeEvent: null,
  isLoading: true,
  setActiveEvent: async () => {},
  createEvent: async () => { throw new Error('EventProvider not mounted'); },
  updateEvent: async () => { throw new Error('EventProvider not mounted'); },
  deleteEvent: async () => {},
  refresh: async () => {},
});

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [activeEventState, setActiveEventState] = useState<DBEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGetEvents();
      setEvents(data);
      setActiveEventState(data.find(e => e.isActive) ?? null);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish its token-check before doing anything.
    // Without this guard, `isAuthenticated` is briefly `false` while
    // the stored token is being verified, causing premature redirect.
    if (authIsLoading) return;

    if (isAuthenticated) {
      refresh();
    } else {
      setIsLoading(false);
      setEvents([]);
      setActiveEventState(null);
    }
  }, [isAuthenticated, authIsLoading, refresh]);

  const setActiveEvent = useCallback(async (event: DBEvent | null): Promise<void> => {
    await apiSetActiveEvent(event ? event._id : null);
    setEvents(prev => prev.map(e => ({ ...e, isActive: e._id === event?._id })));
    setActiveEventState(event ? { ...event, isActive: true } : null);
  }, []);

  const createEvent = useCallback(async (payload: EventPayload): Promise<DBEvent> => {
    const created = await apiCreateEvent(payload);
    setEvents(prev => [created, ...prev]);
    return created;
  }, []);

  const updateEvent = useCallback(async (
    id: string,
    payload: Partial<EventPayload>
  ): Promise<DBEvent> => {
    const updated = await apiUpdateEvent(id, payload);
    setEvents(prev => prev.map(e => (e._id === id ? updated : e)));
    setActiveEventState(prev => (prev?._id === id ? updated : prev));
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await apiDeleteEvent(id);
    setEvents(prev => prev.filter(e => e._id !== id));
    setActiveEventState(prev => (prev?._id === id ? null : prev));
  }, []);

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent: activeEventState,
        isLoading,
        setActiveEvent,
        createEvent,
        updateEvent,
        deleteEvent,
        refresh,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => useContext(EventContext);
