import api from './api';
import { Guest, GuestForm, MessageChannel, ApiResponse, PaginationMeta } from '../types';

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

export const sendInvitation = async (
  id: string,
  channel: MessageChannel
): Promise<Guest> => {
  const res = await api.post<ApiResponse<Guest>>(`/guests/${id}/send`, { channel });
  return res.data.data!;
};

export const exportCSV = (): void => {
  const token = localStorage.getItem('admin_token');
  const url = `/api/guests/export`;
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', 'guests.csv');
  // Add auth header via fetch
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      a.href = blobUrl;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    });
};
