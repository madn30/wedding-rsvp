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

export const sendWhatsAppInvitation = async (guest: Guest): Promise<void> => {
  await api.post<ApiResponse<void>>('/messages/send-invitation', {
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
