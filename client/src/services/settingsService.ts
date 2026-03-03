import api from './api';

export interface MessageTemplates {
  invitation: string;
  reminder30Pending: string;
  reminder30Attending: string;
  declinedReply: string;
  dayOf: string;
}

export interface AppSettings {
  _id: string;
  templates: MessageTemplates;
  rsvpLocked: boolean;
  lockedAt: string | null;
  updatedAt: string;
}

export const getSettings = async (): Promise<AppSettings> => {
  const res = await api.get<{ success: boolean; data: AppSettings }>('/settings');
  return res.data.data;
};

export const updateTemplates = async (
  templates: Partial<MessageTemplates>
): Promise<AppSettings> => {
  const res = await api.put<{ success: boolean; data: AppSettings }>(
    '/settings/templates',
    templates
  );
  return res.data.data;
};

export const setRsvpLock = async (locked: boolean): Promise<{ rsvpLocked: boolean; lockedAt: string | null }> => {
  const res = await api.post<{ success: boolean; data: { rsvpLocked: boolean; lockedAt: string | null } }>(
    '/settings/lock',
    { locked }
  );
  return res.data.data;
};

export const triggerReminder30 = async (): Promise<void> => {
  await api.post('/settings/trigger/reminder30');
};

export const triggerDayOf = async (): Promise<void> => {
  await api.post('/settings/trigger/dayof');
};
