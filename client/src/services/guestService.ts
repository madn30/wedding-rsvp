import api from './api';
import { Guest, GuestForm, ApiResponse, PaginationMeta } from '../types';

export interface GetGuestsParams {
  search?: string;
  response?: string;
  page?: number;
  limit?: number;
}

export const getGuests = async (
  params: GetGuestsParams = {}
): Promise<{ guests: Guest[]; pagination: PaginationMeta }> => {
  const res = await api.get<ApiResponse<Guest[]>>('/guests', { params });
  return {
    guests: res.data.data || [],
    pagination: res.data.pagination!,
  };
};

export const createGuest = async (form: GuestForm): Promise<Guest> => {
  const res = await api.post<ApiResponse<Guest>>('/guests', form);
  return res.data.data!;
};

export const deleteGuest = async (id: string): Promise<void> => {
  await api.delete(`/guests/${id}`);
};

/**
 * Send a WhatsApp invitation to a guest.
 *
 * Calls POST /api/messages/send-invitation with the guest's phone number,
 * a personalised Hebrew message (including their unique RSVP link), and their
 * DB id so the server can update the messageSent / messageSentAt fields.
 */
export const sendWhatsAppInvitation = async (guest: Guest): Promise<void> => {
  // Build the RSVP link from the current origin + guest token.
  // VITE_APP_URL can be set in client/.env for production builds.
  const origin =
    (import.meta.env.VITE_APP_URL as string | undefined) ||
    window.location.origin;

  const rsvpLink = `${origin}/rsvp/${guest.token}`;
  const messageContent =
    `היי ${guest.name}, אנחנו מזמינים אתכם לחתונה שלנו! ` +
    `אנא אשרו הגעה כאן: ${rsvpLink}`;

  await api.post<ApiResponse<void>>('/messages/send-invitation', {
    phoneNumber: guest.phone,
    messageContent,
    guestId: guest._id,
  });
};

export const exportCSV = (): void => {
  const token = localStorage.getItem('admin_token');
  // Must use the full API origin — client and server are on separate Render domains
  const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
  const url = `${baseUrl}/guests/export`;

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'guests.csv';
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => console.error('CSV export error:', err));
};
