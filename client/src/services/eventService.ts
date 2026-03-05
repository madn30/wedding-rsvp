import api from "./api";

export interface DBEvent {
  _id: string;
  name: string;
  groomName: string;
  brideName: string;
  date: string;
  startTime: string;
  location: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventPayload = Omit<
  DBEvent,
  "_id" | "isActive" | "createdAt" | "updatedAt"
>;

export const apiGetEvents = async (): Promise<DBEvent[]> => {
  const res = await api.get<{ success: boolean; data: DBEvent[] }>("/events");
  return res.data.data;
};

export const apiCreateEvent = async (
  payload: EventPayload,
): Promise<DBEvent> => {
  const res = await api.post<{ success: boolean; data: DBEvent }>(
    "/events",
    payload,
  );
  return res.data.data;
};

export const apiUpdateEvent = async (
  id: string,
  payload: Partial<EventPayload>,
): Promise<DBEvent> => {
  const res = await api.put<{ success: boolean; data: DBEvent }>(
    `/events/${id}`,
    payload,
  );
  return res.data.data;
};

export const apiDeleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/events/${id}`);
};

export const apiSetActiveEvent = async (id: string | null): Promise<void> => {
  if (id) {
    await api.post(`/events/${id}/set-active`);
  } else {
    await api.post("/events/clear-active");
  }
};
